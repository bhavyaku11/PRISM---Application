import 'package:flutter/material.dart';
import '../../../../app/theme.dart';

enum NotificationType {
  policyRenewal('POLICY_RENEWAL'),
  policyExpiry('POLICY_EXPIRY'),
  claimDocuments('CLAIM_DOCUMENTS'),
  claimPreparation('CLAIM_PREPARATION'),
  documentProcessed('DOCUMENT_PROCESSED'),
  documentFailed('DOCUMENT_FAILED'),
  general('GENERAL');

  final String value;
  const NotificationType(this.value);

  static NotificationType fromString(String? type) {
    if (type == null) return NotificationType.general;
    for (final t in NotificationType.values) {
      if (t.value == type) return t;
    }
    return NotificationType.general;
  }
}

enum NotificationPriority {
  informational('informational'),
  attention('attention'),
  urgent('urgent');

  final String value;
  const NotificationPriority(this.value);

  static NotificationPriority fromString(String? p) {
    if (p == null) return NotificationPriority.informational;
    for (final v in NotificationPriority.values) {
      if (v.value == p.toLowerCase()) return v;
    }
    return NotificationPriority.informational;
  }
}

enum NotificationFilter {
  all,
  unread,
  policies,
  claims,
  documents,
}

class AppNotificationModel {
  final String id;
  final String userId;
  final String title;
  final String message;
  final NotificationType notificationType;
  final NotificationPriority priority;
  final String? actionUrl;
  final bool isRead;
  final DateTime createdAt;

  const AppNotificationModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    required this.notificationType,
    required this.priority,
    this.actionUrl,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotificationModel.fromJson(Map<String, dynamic> json) {
    return AppNotificationModel(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      title: json['title'] as String? ?? 'Notification',
      message: json['message'] as String? ?? '',
      notificationType:
          NotificationType.fromString(json['notification_type'] as String?),
      priority: NotificationPriority.fromString(json['priority'] as String?),
      actionUrl: json['action_url'] as String?,
      isRead: json['is_read'] as bool? ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'title': title,
      'message': message,
      'notification_type': notificationType.value,
      'priority': priority.value,
      'action_url': actionUrl,
      'is_read': isRead,
      'created_at': createdAt.toIso8601String(),
    };
  }

  AppNotificationModel copyWith({
    String? id,
    String? userId,
    String? title,
    String? message,
    NotificationType? notificationType,
    NotificationPriority? priority,
    String? actionUrl,
    bool? isRead,
    DateTime? createdAt,
  }) {
    return AppNotificationModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      message: message ?? this.message,
      notificationType: notificationType ?? this.notificationType,
      priority: priority ?? this.priority,
      actionUrl: actionUrl ?? this.actionUrl,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  IconData get iconData {
    switch (notificationType) {
      case NotificationType.policyRenewal:
        return Icons.calendar_today_outlined;
      case NotificationType.policyExpiry:
        return Icons.warning_amber_rounded;
      case NotificationType.claimDocuments:
        return Icons.description_outlined;
      case NotificationType.claimPreparation:
        return Icons.assignment_turned_in_outlined;
      case NotificationType.documentProcessed:
        return Icons.check_circle_outline;
      case NotificationType.documentFailed:
        return Icons.cancel_outlined;
      case NotificationType.general:
        return priority == NotificationPriority.urgent
            ? Icons.warning_amber_rounded
            : Icons.notifications_none;
    }
  }

  Color get iconColor {
    switch (priority) {
      case NotificationPriority.urgent:
        return PrismTheme.error;
      case NotificationPriority.attention:
        return PrismTheme.warning;
      case NotificationPriority.informational:
        return PrismTheme.primaryBlue;
    }
  }

  Color get iconBackgroundColor {
    switch (priority) {
      case NotificationPriority.urgent:
        return const Color(0xFFFEE2E2);
      case NotificationPriority.attention:
        return const Color(0xFFFEF3C7);
      case NotificationPriority.informational:
        return const Color(0xFFEFF6FF);
    }
  }

  String get priorityLabel {
    switch (priority) {
      case NotificationPriority.urgent:
        return 'Urgent';
      case NotificationPriority.attention:
        return 'Attention';
      case NotificationPriority.informational:
        return 'Info';
    }
  }

  String get actionLabel {
    switch (notificationType) {
      case NotificationType.policyRenewal:
      case NotificationType.policyExpiry:
        return 'Review Policy';
      case NotificationType.claimDocuments:
      case NotificationType.claimPreparation:
        return 'Open Claim';
      case NotificationType.documentProcessed:
      case NotificationType.documentFailed:
        return 'View Policy';
      case NotificationType.general:
        return 'View Details';
    }
  }

  String get relativeTime {
    final now = DateTime.now();
    final diff = now.difference(createdAt);

    if (diff.inSeconds < 60) {
      return 'Just now';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    } else {
      return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
    }
  }
}
