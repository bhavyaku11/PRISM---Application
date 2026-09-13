import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/notifications/models/notification_model.dart';
import 'package:prism_mobile/features/notifications/screens/notifications_screen.dart';
import 'package:prism_mobile/features/notifications/services/notification_service.dart';

class MockNotificationService extends NotificationService {
  final List<AppNotificationModel> items;
  bool markAsReadCalled = false;
  bool markAllAsReadCalled = false;
  String? lastReadId;

  MockNotificationService(this.items);

  @override
  Future<List<AppNotificationModel>> fetchAndSyncNotifications() async {
    return List.from(items);
  }

  @override
  Future<bool> markAsRead(String notificationId) async {
    markAsReadCalled = true;
    lastReadId = notificationId;
    return true;
  }

  @override
  Future<bool> markAllAsRead() async {
    markAllAsReadCalled = true;
    return true;
  }

  @override
  Future<int> getUnreadCount() async {
    return items.where((n) => !n.isRead).length;
  }
}

void main() {
  final sampleNotifications = [
    AppNotificationModel(
      id: 'notif_1',
      userId: 'usr_1',
      title: 'Policy renewal approaching: HDFC ERGO',
      message: 'Your policy expires in 14 days. Review your renewal.',
      notificationType: NotificationType.policyRenewal,
      priority: NotificationPriority.attention,
      actionUrl: '/policies/pol_1',
      isRead: false,
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
    ),
    AppNotificationModel(
      id: 'notif_2',
      userId: 'usr_1',
      title: 'Claim documents needed: Appendectomy',
      message: '1 required document is still needed for your claim.',
      notificationType: NotificationType.claimDocuments,
      priority: NotificationPriority.urgent,
      actionUrl: '/claims/claim_1',
      isRead: false,
      createdAt: DateTime.now().subtract(const Duration(hours: 5)),
    ),
    AppNotificationModel(
      id: 'notif_3',
      userId: 'usr_1',
      title: 'Policy ready: Star Health',
      message: 'Your policy document is processed and ready.',
      notificationType: NotificationType.documentProcessed,
      priority: NotificationPriority.informational,
      actionUrl: '/policies/pol_2',
      isRead: true,
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
    ),
  ];

  group('NotificationsScreen Widget Tests', () {
    testWidgets(
        'renders header, supporting text, and empty state when 0 notifications',
        (tester) async {
      final mockService = MockNotificationService([]);

      await tester.pumpWidget(
        MaterialApp(
          home: NotificationsScreen(notificationService: mockService),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Notifications'), findsNWidgets(2)); // AppBar + Header
      expect(
        find.text(
            'Important updates about your policies, claims, and documents.'),
        findsOneWidget,
      );
      expect(find.text("You're all caught up."), findsOneWidget);
      expect(
          find.text('Important updates will appear here.'), findsOneWidget);
    });

    testWidgets(
        'renders real notifications list with unread badge and filter chips',
        (tester) async {
      final mockService = MockNotificationService(sampleNotifications);

      await tester.pumpWidget(
        MaterialApp(
          home: NotificationsScreen(notificationService: mockService),
        ),
      );
      await tester.pumpAndSettle();

      // Header shows unread badge
      expect(find.text('2 new'), findsOneWidget);
      expect(find.text('Mark all read'), findsOneWidget);

      // Filter chips rendered with counts
      expect(find.text('All (3)'), findsOneWidget);
      expect(find.text('Unread (2)'), findsOneWidget);
      expect(find.text('Policies (1)'), findsOneWidget);
      expect(find.text('Claims (1)'), findsOneWidget);
      expect(find.text('Documents (1)'), findsOneWidget);

      // Notification cards rendered
      expect(find.text('Policy renewal approaching: HDFC ERGO'), findsOneWidget);
      expect(find.text('Claim documents needed: Appendectomy'), findsOneWidget);
      expect(find.text('Policy ready: Star Health'), findsOneWidget);

      // Priority badges
      expect(find.text('Attention'), findsOneWidget);
      expect(find.text('Urgent'), findsOneWidget);
      expect(find.text('Info'), findsOneWidget);

      // Action labels
      expect(find.text('Review Policy'), findsOneWidget);
      expect(find.text('Open Claim'), findsOneWidget);
      expect(find.text('View Policy'), findsOneWidget);
    });

    testWidgets('filtering by Unread displays only unread notifications',
        (tester) async {
      final mockService = MockNotificationService(sampleNotifications);

      await tester.pumpWidget(
        MaterialApp(
          home: NotificationsScreen(notificationService: mockService),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Unread filter
      await tester.tap(find.text('Unread (2)'));
      await tester.pumpAndSettle();

      expect(find.text('Policy renewal approaching: HDFC ERGO'), findsOneWidget);
      expect(find.text('Claim documents needed: Appendectomy'), findsOneWidget);
      expect(find.text('Policy ready: Star Health'), findsNothing);
    });

    testWidgets('filtering by Policies displays only policy notifications',
        (tester) async {
      final mockService = MockNotificationService(sampleNotifications);

      await tester.pumpWidget(
        MaterialApp(
          home: NotificationsScreen(notificationService: mockService),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Policies filter
      await tester.tap(find.text('Policies (1)'));
      await tester.pumpAndSettle();

      expect(find.text('Policy renewal approaching: HDFC ERGO'), findsOneWidget);
      expect(find.text('Claim documents needed: Appendectomy'), findsNothing);
      expect(find.text('Policy ready: Star Health'), findsNothing);
    });

    testWidgets('mark all read button updates unread status across screen',
        (tester) async {
      final mockService = MockNotificationService(sampleNotifications);

      await tester.pumpWidget(
        MaterialApp(
          home: NotificationsScreen(notificationService: mockService),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Mark all read'), findsOneWidget);
      await tester.tap(find.text('Mark all read'));
      await tester.pumpAndSettle();

      expect(mockService.markAllAsReadCalled, isTrue);
      // Unread count is now 0, mark all read button disappears
      expect(find.text('Mark all read'), findsNothing);
      expect(find.text('Unread (0)'), findsOneWidget);
    });

    testWidgets('tapping mark read on card marks individual notification read',
        (tester) async {
      final mockService = MockNotificationService(sampleNotifications);

      await tester.pumpWidget(
        MaterialApp(
          home: NotificationsScreen(notificationService: mockService),
        ),
      );
      await tester.pumpAndSettle();

      // Find first "Mark read" button
      final markReadButtons = find.text('Mark read');
      expect(markReadButtons, findsNWidgets(2));

      await tester.tap(markReadButtons.first);
      await tester.pumpAndSettle();

      expect(mockService.markAsReadCalled, isTrue);
      expect(mockService.lastReadId, 'notif_1');
    });

    testWidgets('renders cleanly on 360px screen width without overflow',
        (tester) async {
      tester.view.physicalSize = const Size(360 * 2.0, 800 * 2.0);
      tester.view.devicePixelRatio = 2.0;

      final mockService = MockNotificationService(sampleNotifications);

      await tester.pumpWidget(
        MaterialApp(
          home: NotificationsScreen(notificationService: mockService),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);

      addTearDown(() {
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      });
    });
  });
}
