import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/notifications/models/notification_model.dart';

void main() {
  group('AppNotificationModel Tests', () {
    test('serializes and deserializes correctly from json', () {
      final json = {
        'id': 'notif_001',
        'user_id': 'usr_test_123',
        'title': 'Policy renewal approaching: Optima Secure',
        'message': 'Your policy expires in 14 days. Review your renewal.',
        'notification_type': 'POLICY_RENEWAL',
        'priority': 'urgent',
        'action_url': '/policies/pol_123',
        'is_read': false,
        'created_at': '2025-01-10T12:00:00.000Z',
      };

      final model = AppNotificationModel.fromJson(json);

      expect(model.id, 'notif_001');
      expect(model.userId, 'usr_test_123');
      expect(model.title, 'Policy renewal approaching: Optima Secure');
      expect(model.notificationType, NotificationType.policyRenewal);
      expect(model.priority, NotificationPriority.urgent);
      expect(model.actionUrl, '/policies/pol_123');
      expect(model.isRead, isFalse);
      expect(model.priorityLabel, 'Urgent');
      expect(model.actionLabel, 'Review Policy');
      expect(model.iconData, Icons.calendar_today_outlined);

      final outJson = model.toJson();
      expect(outJson['notification_type'], 'POLICY_RENEWAL');
      expect(outJson['priority'], 'urgent');
    });

    test('maps all notification types to semantic icons and action labels', () {
      final types = [
        NotificationType.policyRenewal,
        NotificationType.policyExpiry,
        NotificationType.claimDocuments,
        NotificationType.claimPreparation,
        NotificationType.documentProcessed,
        NotificationType.documentFailed,
        NotificationType.general,
      ];

      for (final t in types) {
        final notif = AppNotificationModel(
          id: 'n_1',
          userId: 'u_1',
          title: 'Test',
          message: 'Test message',
          notificationType: t,
          priority: NotificationPriority.informational,
          isRead: false,
          createdAt: DateTime.now(),
        );

        expect(notif.iconData, isNotNull);
        expect(notif.actionLabel, isNotEmpty);
      }
    });

    test('copyWith updates fields while preserving existing ones', () {
      final original = AppNotificationModel(
        id: 'n_orig',
        userId: 'u_1',
        title: 'Original Title',
        message: 'Original Message',
        notificationType: NotificationType.claimDocuments,
        priority: NotificationPriority.attention,
        isRead: false,
        createdAt: DateTime.now(),
      );

      final updated = original.copyWith(isRead: true);
      expect(updated.isRead, isTrue);
      expect(updated.id, original.id);
      expect(updated.title, original.title);
      expect(updated.notificationType, original.notificationType);
    });

    test('format relative time computes accurate text', () {
      final now = DateTime.now();

      final justNow = AppNotificationModel(
        id: '1',
        userId: 'u',
        title: 'T',
        message: 'M',
        notificationType: NotificationType.general,
        priority: NotificationPriority.informational,
        isRead: false,
        createdAt: now.subtract(const Duration(seconds: 15)),
      );
      expect(justNow.relativeTime, 'Just now');

      final minutesAgo = AppNotificationModel(
        id: '2',
        userId: 'u',
        title: 'T',
        message: 'M',
        notificationType: NotificationType.general,
        priority: NotificationPriority.informational,
        isRead: false,
        createdAt: now.subtract(const Duration(minutes: 5)),
      );
      expect(minutesAgo.relativeTime, '5m ago');

      final hoursAgo = AppNotificationModel(
        id: '3',
        userId: 'u',
        title: 'T',
        message: 'M',
        notificationType: NotificationType.general,
        priority: NotificationPriority.informational,
        isRead: false,
        createdAt: now.subtract(const Duration(hours: 3)),
      );
      expect(hoursAgo.relativeTime, '3h ago');
    });
  });
}
