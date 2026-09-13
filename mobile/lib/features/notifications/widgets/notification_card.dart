import 'package:flutter/material.dart';
import '../../../../app/theme.dart';
import '../models/notification_model.dart';

class NotificationCard extends StatelessWidget {
  final AppNotificationModel notification;
  final VoidCallback? onTap;
  final VoidCallback? onMarkAsRead;

  const NotificationCard({
    super.key,
    required this.notification,
    this.onTap,
    this.onMarkAsRead,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final backgroundColor = isDark
        ? (notification.isRead
            ? PrismTheme.cardDark
            : const Color(0xFF131F33))
        : (notification.isRead
            ? Colors.white
            : const Color(0xFFF0F6FF));

    final borderColor = isDark
        ? (notification.isRead
            ? PrismTheme.borderDark
            : PrismTheme.primaryBlue.withValues(alpha: 0.5))
        : (notification.isRead
            ? PrismTheme.borderSubtle
            : PrismTheme.primaryBlue.withValues(alpha: 0.3));

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: borderColor, width: notification.isRead ? 1 : 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Icon + Title + Priority Badge
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Semantic Icon
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: isDark
                        ? notification.iconColor.withValues(alpha: 0.2)
                        : notification.iconBackgroundColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Icon(
                      notification.iconData,
                      color: notification.iconColor,
                      size: 20,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Title and Meta
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (!notification.isRead) ...[
                            Container(
                              width: 8,
                              height: 8,
                              margin: const EdgeInsets.only(right: 6),
                              decoration: const BoxDecoration(
                                color: PrismTheme.primaryBlue,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                          Expanded(
                            child: Text(
                              notification.title,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: notification.isRead
                                    ? FontWeight.w600
                                    : FontWeight.bold,
                                color: isDark
                                    ? (notification.isRead
                                        ? Colors.white.withValues(alpha: 0.85)
                                        : Colors.white)
                                    : (notification.isRead
                                        ? PrismTheme.textPrimary
                                        : PrismTheme.navy),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Priority Badge
                          _buildPriorityBadge(context, isDark),
                        ],
                      ),
                      const SizedBox(height: 2),
                      // Relative Time
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 12,
                            color: isDark
                                ? PrismTheme.textMuted
                                : PrismTheme.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            notification.relativeTime,
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark
                                  ? PrismTheme.textMuted
                                  : PrismTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 10),

            // Message text
            Padding(
              padding: const EdgeInsets.only(left: 50),
              child: Text(
                notification.message,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.75)
                      : PrismTheme.textSecondary,
                ),
              ),
            ),

            // Action row if actionUrl exists or unread toggle
            Padding(
              padding: const EdgeInsets.only(left: 50, top: 12),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                alignment: WrapAlignment.spaceBetween,
                children: [
                  if (notification.actionUrl != null &&
                      notification.actionUrl!.isNotEmpty)
                    ElevatedButton.icon(
                      onPressed: onTap,
                      icon: const Icon(Icons.arrow_forward, size: 14),
                      label: Text(notification.actionLabel),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        textStyle: const TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w600),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        backgroundColor: isDark
                            ? PrismTheme.primaryBlue
                            : PrismTheme.navy,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),

                  // Mark as Read / Read Status
                  if (!notification.isRead && onMarkAsRead != null)
                    TextButton.icon(
                      onPressed: onMarkAsRead,
                      icon: const Icon(Icons.check, size: 14),
                      label: const Text('Mark read'),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        textStyle: const TextStyle(
                            fontSize: 11, fontWeight: FontWeight.w500),
                        foregroundColor: PrismTheme.primaryBlue,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    )
                  else
                    Text(
                      'Read',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark
                            ? PrismTheme.textMuted
                            : PrismTheme.textMuted,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriorityBadge(BuildContext context, bool isDark) {
    Color textColor;
    Color bgColor;

    switch (notification.priority) {
      case NotificationPriority.urgent:
        textColor = isDark ? const Color(0xFFFCA5A5) : const Color(0xFFB91C1C);
        bgColor = isDark ? const Color(0xFF450A0A) : const Color(0xFFFEE2E2);
        break;
      case NotificationPriority.attention:
        textColor = isDark ? const Color(0xFFFDE68A) : const Color(0xFFB45309);
        bgColor = isDark ? const Color(0xFF451A03) : const Color(0xFFFEF3C7);
        break;
      case NotificationPriority.informational:
        textColor = isDark ? const Color(0xFF93C5FD) : const Color(0xFF1D4ED8);
        bgColor = isDark ? const Color(0xFF1E3A8A) : const Color(0xFFEFF6FF);
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        notification.priorityLabel,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: textColor,
        ),
      ),
    );
  }
}
