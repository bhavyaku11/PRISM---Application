import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme.dart';
import '../models/notification_model.dart';
import '../services/notification_service.dart';
import '../widgets/notification_card.dart';

class NotificationsScreen extends StatefulWidget {
  final NotificationService? notificationService;

  const NotificationsScreen({
    super.key,
    this.notificationService,
  });

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late final NotificationService _service;
  List<AppNotificationModel> _notifications = [];
  bool _isLoading = true;
  String? _errorMessage;
  NotificationFilter _selectedFilter = NotificationFilter.all;

  @override
  void initState() {
    super.initState();
    _service = widget.notificationService ?? NotificationService();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final items = await _service.fetchAndSyncNotifications();
      if (mounted) {
        setState(() {
          _notifications = items;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage =
              'Unable to load notifications. Please check your connection.';
          _isLoading = false;
        });
      }
    }
  }

  int get _unreadCount => _notifications.where((n) => !n.isRead).length;

  int _getCountForFilter(NotificationFilter filter) {
    switch (filter) {
      case NotificationFilter.all:
        return _notifications.length;
      case NotificationFilter.unread:
        return _unreadCount;
      case NotificationFilter.policies:
        return _notifications
            .where((n) =>
                n.notificationType == NotificationType.policyRenewal ||
                n.notificationType == NotificationType.policyExpiry)
            .length;
      case NotificationFilter.claims:
        return _notifications
            .where((n) =>
                n.notificationType == NotificationType.claimDocuments ||
                n.notificationType == NotificationType.claimPreparation)
            .length;
      case NotificationFilter.documents:
        return _notifications
            .where((n) =>
                n.notificationType == NotificationType.documentProcessed ||
                n.notificationType == NotificationType.documentFailed)
            .length;
    }
  }

  List<AppNotificationModel> get _filteredNotifications {
    return _notifications.where((n) {
      switch (_selectedFilter) {
        case NotificationFilter.unread:
          return !n.isRead;
        case NotificationFilter.policies:
          return n.notificationType == NotificationType.policyRenewal ||
              n.notificationType == NotificationType.policyExpiry;
        case NotificationFilter.claims:
          return n.notificationType == NotificationType.claimDocuments ||
              n.notificationType == NotificationType.claimPreparation;
        case NotificationFilter.documents:
          return n.notificationType == NotificationType.documentProcessed ||
              n.notificationType == NotificationType.documentFailed;
        case NotificationFilter.all:
          return true;
      }
    }).toList();
  }

  Future<void> _markAsRead(AppNotificationModel notification) async {
    if (notification.isRead) return;

    // Optimistic UI update
    setState(() {
      _notifications = _notifications.map((n) {
        return n.id == notification.id ? n.copyWith(isRead: true) : n;
      }).toList();
    });

    await _service.markAsRead(notification.id);
  }

  Future<void> _markAllAsRead() async {
    if (_unreadCount == 0) return;

    // Optimistic UI update
    setState(() {
      _notifications =
          _notifications.map((n) => n.copyWith(isRead: true)).toList();
    });

    await _service.markAllAsRead();
  }

  void _handleNotificationTap(AppNotificationModel notification) {
    // Mark as read when opened
    _markAsRead(notification);

    // Deep navigation if actionUrl is present
    final url = notification.actionUrl;
    if (url != null && url.isNotEmpty) {
      try {
        context.push(url);
      } catch (_) {
        // Safe fallback if route cannot be pushed
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor:
          isDark ? PrismTheme.backgroundDark : PrismTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (_unreadCount > 0)
            TextButton.icon(
              onPressed: _markAllAsRead,
              icon: const Icon(Icons.done_all, size: 16),
              label: const Text(
                'Mark all read',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              ),
              style: TextButton.styleFrom(
                foregroundColor: PrismTheme.primaryBlue,
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadNotifications,
        color: PrismTheme.primaryBlue,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          children: [
            // Header Section
            _buildHeader(context, isDark),
            const SizedBox(height: 16),

            // Horizontal Filter Chips
            _buildFilterChips(context, isDark),
            const SizedBox(height: 16),

            // Main Content: Loading, Error, Empty, or List
            if (_isLoading) ...[
              const SizedBox(height: 60),
              const Center(
                child: CircularProgressIndicator(
                  color: PrismTheme.primaryBlue,
                  strokeWidth: 2.5,
                ),
              ),
            ] else if (_errorMessage != null) ...[
              _buildErrorState(context, isDark),
            ] else if (_filteredNotifications.isEmpty) ...[
              _buildEmptyState(context, isDark),
            ] else ...[
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _filteredNotifications.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final notif = _filteredNotifications[index];
                  return NotificationCard(
                    notification: notif,
                    onTap: () => _handleNotificationTap(notif),
                    onMarkAsRead: () => _markAsRead(notif),
                  );
                },
              ),
            ],

            const SizedBox(height: 24),

            // Informational Safety & Compliance Notice
            _buildInfoCard(context, isDark),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Flexible(
              child: Text(
                'Notifications',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.3,
                  color: isDark ? Colors.white : PrismTheme.navy,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (_unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: PrismTheme.primaryBlue,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$_unreadCount new',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Important updates about your policies, claims, and documents.',
          style: TextStyle(
            fontSize: 13,
            color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChips(BuildContext context, bool isDark) {
    final filters = [
      NotificationFilter.all,
      NotificationFilter.unread,
      NotificationFilter.policies,
      NotificationFilter.claims,
      NotificationFilter.documents,
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: filters.map((filter) {
          final isSelected = _selectedFilter == filter;
          final count = _getCountForFilter(filter);
          String label;

          switch (filter) {
            case NotificationFilter.all:
              label = 'All';
              break;
            case NotificationFilter.unread:
              label = 'Unread';
              break;
            case NotificationFilter.policies:
              label = 'Policies';
              break;
            case NotificationFilter.claims:
              label = 'Claims';
              break;
            case NotificationFilter.documents:
              label = 'Documents';
              break;
          }

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text('$label ($count)'),
              selected: isSelected,
              onSelected: (_) {
                setState(() {
                  _selectedFilter = filter;
                });
              },
              showCheckmark: false,
              selectedColor:
                  isDark ? PrismTheme.primaryBlue : PrismTheme.navy,
              backgroundColor: isDark ? PrismTheme.cardDark : Colors.white,
              labelStyle: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected
                    ? Colors.white
                    : (isDark ? Colors.white70 : PrismTheme.textSecondary),
              ),
              side: BorderSide(
                color: isSelected
                    ? Colors.transparent
                    : (isDark
                        ? PrismTheme.borderDark
                        : PrismTheme.borderSubtle),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: isDark
                  ? PrismTheme.primaryBlue.withValues(alpha: 0.2)
                  : const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Center(
              child: Icon(
                Icons.notifications_none,
                color: PrismTheme.primaryBlue,
                size: 28,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            "You're all caught up.",
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : PrismTheme.navy,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Important updates will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: isDark ? PrismTheme.textMuted : PrismTheme.textSecondary,
            ),
          ),
          if (_selectedFilter != NotificationFilter.all) ...[
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () {
                setState(() {
                  _selectedFilter = NotificationFilter.all;
                });
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: PrismTheme.primaryBlue,
                side: const BorderSide(color: PrismTheme.primaryBlue),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('View all notifications'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
        ),
      ),
      child: Column(
        children: [
          const Icon(Icons.error_outline, color: PrismTheme.error, size: 40),
          const SizedBox(height: 12),
          Text(
            _errorMessage ?? 'An error occurred',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: isDark ? Colors.white : PrismTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadNotifications,
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? PrismTheme.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? PrismTheme.borderDark : PrismTheme.borderSubtle,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline,
              color: PrismTheme.primaryBlue, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Proactive Policy & Claim Decision Support',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : PrismTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'PRISM alerts reflect real schedule dates and document readiness indicators. Notifications are informational and do not predict claim approval or constitute automatic policy renewal.',
                  style: TextStyle(
                    fontSize: 11,
                    height: 1.4,
                    color: isDark
                        ? PrismTheme.textMuted
                        : PrismTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
