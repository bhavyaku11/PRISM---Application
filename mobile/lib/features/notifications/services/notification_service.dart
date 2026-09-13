import 'package:supabase_flutter/supabase_flutter.dart';
import '../../claims/models/claim_model.dart';
import '../../policies/models/policy_model.dart';
import '../models/notification_model.dart';

/// Manages in-app notification synchronization, retrieval, and status updates.
/// Mirrors PRISM web's deterministic synchronization logic to ensure zero data drift.
class NotificationService {
  final SupabaseClient _client;

  NotificationService({SupabaseClient? client})
      : _client = client ?? _getSafeClient();

  static SupabaseClient _getSafeClient() {
    try {
      return Supabase.instance.client;
    } catch (_) {
      return SupabaseClient(
        'https://dummy.supabase.co',
        'dummy-key',
        authOptions: const AuthClientOptions(autoRefreshToken: false),
      );
    }
  }

  User? get _currentUser => _client.auth.currentUser;

  /// Deterministically synchronizes and fetches notifications for the authenticated user.
  /// Generates proactive alerts from real policy end dates and claim document readiness.
  Future<List<AppNotificationModel>> fetchAndSyncNotifications() async {
    final user = _currentUser;
    if (user == null) return [];

    try {
      // 1. Fetch existing notifications, policies, claims, and claim documents concurrently
      final results = await Future.wait([
        _client
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', ascending: false),
        _client.from('policies').select('*').eq('user_id', user.id),
        _client.from('claims').select('*').eq('user_id', user.id),
        _client
            .from('claim_documents')
            .select('*, documents(*)')
            .eq('user_id', user.id),
      ]);

      final notifData = results[0] as List<dynamic>;
      final policyData = results[1] as List<dynamic>;
      final claimData = results[2] as List<dynamic>;
      final claimDocData = results[3] as List<dynamic>;

      final existingNotifications = notifData
          .map((n) => AppNotificationModel.fromJson(n as Map<String, dynamic>))
          .toList();

      final policies = policyData
          .map((p) => PolicyModel.fromJson(p as Map<String, dynamic>))
          .toList();

      final claims = claimData
          .map((c) => ClaimModel.fromJson(c as Map<String, dynamic>))
          .toList();

      final claimDocuments = claimDocData
          .map((cd) => ClaimDocumentModel.fromJson(cd as Map<String, dynamic>))
          .toList();

      final List<Map<String, dynamic>> toInsert = [];
      final now = DateTime.now();

      // Deduplication helper
      bool hasNotification(
        NotificationType type,
        String actionUrl, {
        bool requireUnread = false,
      }) {
        return existingNotifications.any((n) {
          final match =
              n.notificationType == type && n.actionUrl == actionUrl;
          return requireUnread ? match && !n.isRead : match;
        });
      }

      // 2. Policy-driven notifications (Processing status + Expiry/Renewal)
      for (final policy in policies) {
        final policyUrl = '/policies/${policy.id}';

        // A. Document processing status
        if (policy.status == 'processed' || policy.status == 'active') {
          if (!hasNotification(
              NotificationType.documentProcessed, policyUrl)) {
            toInsert.add({
              'user_id': user.id,
              'title': 'Policy ready: ${policy.policyName}',
              'message':
                  'Your ${policy.insurerName} policy is processed and ready for clause analysis.',
              'notification_type':
                  NotificationType.documentProcessed.value,
              'priority': NotificationPriority.informational.value,
              'action_url': policyUrl,
              'is_read': false,
            });
          }
        } else if (policy.status == 'failed') {
          if (!hasNotification(
              NotificationType.documentFailed, policyUrl)) {
            toInsert.add({
              'user_id': user.id,
              'title': 'Processing failed: ${policy.policyName}',
              'message':
                  'We could not finish processing your ${policy.policyName} document. Please review your file.',
              'notification_type': NotificationType.documentFailed.value,
              'priority': NotificationPriority.attention.value,
              'action_url': policyUrl,
              'is_read': false,
            });
          }
        }

        // B. Expiry & Renewal Intelligence (Strictly based on real policy end date)
        if (policy.endDate != null && policy.endDate!.isNotEmpty) {
          final endDate = DateTime.tryParse(policy.endDate!);
          if (endDate != null) {
            final diffDays = endDate.difference(now).inDays;

            if (diffDays <= 0) {
            // Expired policy
            if (!hasNotification(
                NotificationType.policyExpiry, policyUrl)) {
              toInsert.add({
                'user_id': user.id,
                'title': 'Policy expired: ${policy.policyName}',
                'message':
                    'Your policy period has ended. Review renewal options with ${policy.insurerName}.',
                'notification_type': NotificationType.policyExpiry.value,
                'priority': NotificationPriority.urgent.value,
                'action_url': policyUrl,
                'is_read': false,
              });
            }
          } else if (diffDays <= 30) {
            // Renewal approaching within 30 days
            if (!hasNotification(
                NotificationType.policyRenewal, policyUrl,
                requireUnread: true)) {
              final renewalMsg = diffDays == 1
                  ? 'Your policy expires tomorrow. Review your renewal.'
                  : 'Your policy expires in $diffDays days. Review your renewal.';

              toInsert.add({
                'user_id': user.id,
                'title':
                    'Policy renewal approaching: ${policy.policyName}',
                'message': renewalMsg,
                'notification_type':
                    NotificationType.policyRenewal.value,
                'priority': diffDays <= 7
                    ? NotificationPriority.urgent.value
                    : NotificationPriority.attention.value,
                'action_url': policyUrl,
                'is_read': false,
              });
            }
          }
        }
      }
    }

      // 3. Claim-driven notifications (Missing mandatory documents & preparation readiness)
      for (final claim in claims) {
        if (claim.status == 'closed' || claim.status == 'archived') {
          continue;
        }

        final claimUrl = '/claims/${claim.id}';
        final attachedDocs =
            claimDocuments.where((cd) => cd.claimId == claim.id).toList();
        final readiness = calculateClaimReadiness(attachedDocs);

        if (readiness.missingMandatoryCategories.isNotEmpty) {
          if (!hasNotification(
              NotificationType.claimDocuments, claimUrl,
              requireUnread: true)) {
            final missingCount = readiness.missingMandatoryCategories.length;
            final msg = missingCount == 1
                ? '1 required document is still needed for your claim.'
                : '$missingCount required documents are still needed for your claim.';

            toInsert.add({
              'user_id': user.id,
              'title': 'Claim documents needed: ${claim.claimName}',
              'message': msg,
              'notification_type':
                  NotificationType.claimDocuments.value,
              'priority': NotificationPriority.attention.value,
              'action_url': claimUrl,
              'is_read': false,
            });
          }
        } else if (readiness.score >= 90 && attachedDocs.length >= 3) {
          if (!hasNotification(
              NotificationType.claimPreparation, claimUrl)) {
            toInsert.add({
              'user_id': user.id,
              'title': 'Claim dossier ready: ${claim.claimName}',
              'message':
                  'All required documents have been uploaded. Your claim is ready for review.',
              'notification_type':
                  NotificationType.claimPreparation.value,
              'priority': NotificationPriority.informational.value,
              'action_url': claimUrl,
              'is_read': false,
            });
          }
        }
      }

      // 4. Batch insert any newly identified notifications
      if (toInsert.isNotEmpty) {
        try {
          final inserted = await _client
              .from('notifications')
              .insert(toInsert)
              .select('*');

          final newItems = (inserted as List<dynamic>)
              .map((n) =>
                  AppNotificationModel.fromJson(n as Map<String, dynamic>))
              .toList();

          return [...newItems, ...existingNotifications];
        } catch (_) {
          // Graceful fallback to existing notifications if insert fails
        }
      }

      return existingNotifications;
    } catch (_) {
      // Return safe fallback or empty list on connection error
      return [];
    }
  }

  /// Marks a single notification as read for the authenticated user.
  Future<bool> markAsRead(String notificationId) async {
    final user = _currentUser;
    if (user == null) return false;

    try {
      await _client
          .from('notifications')
          .update({'is_read': true})
          .eq('id', notificationId)
          .eq('user_id', user.id);
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Marks all unread notifications as read for the authenticated user.
  Future<bool> markAllAsRead() async {
    final user = _currentUser;
    if (user == null) return false;

    try {
      await _client
          .from('notifications')
          .update({'is_read': true})
          .eq('user_id', user.id)
          .eq('is_read', false);
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Retrieves the unread notification count for the authenticated user.
  Future<int> getUnreadCount() async {
    final user = _currentUser;
    if (user == null) return 0;

    try {
      final res = await _client
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_read', false);
      return (res as List<dynamic>).length;
    } catch (_) {
      return 0;
    }
  }
}
