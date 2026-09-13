import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:prism_mobile/features/auth/services/auth_service.dart';
import 'package:prism_mobile/features/notifications/services/notification_service.dart';
import 'package:prism_mobile/features/profile/models/profile_model.dart';
import 'package:prism_mobile/features/profile/services/profile_service.dart';
import 'package:prism_mobile/features/settings/controllers/theme_controller.dart';
import 'package:prism_mobile/features/settings/screens/settings_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockProfileService extends ProfileService {
  final ProfileModel? profile;
  MockProfileService(this.profile);

  @override
  Future<ProfileModel?> getProfile() async => profile;
}

class MockNotificationService extends NotificationService {
  final int unreadCount;
  MockNotificationService(this.unreadCount);

  @override
  Future<int> getUnreadCount() async => unreadCount;
}

class MockAuthService extends AuthService {
  bool signOutCalled = false;

  @override
  Future<void> signOut() async {
    signOutCalled = true;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final sampleProfile = ProfileModel(
    id: 'usr_settings_1',
    fullName: 'Bhavya Kumar',
    email: 'bhavya@prism.app',
  );

  void setTestViewport(WidgetTester tester, {double width = 800, double height = 2000}) {
    tester.view.physicalSize = Size(width, height);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });
  }

  group('SettingsScreen Widget Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    testWidgets('renders all major sections and authentic user info',
        (tester) async {
      setTestViewport(tester);
      final profileService = MockProfileService(sampleProfile);
      final notificationService = MockNotificationService(3);
      final authService = MockAuthService();
      final themeController = ThemeController.testable();

      await tester.pumpWidget(
        MaterialApp(
          home: SettingsScreen(
            profileService: profileService,
            notificationService: notificationService,
            authService: authService,
            themeController: themeController,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Profile Header
      expect(find.text('Bhavya Kumar'), findsOneWidget);
      expect(find.text('bhavya@prism.app'), findsOneWidget);
      expect(find.text('Edit Profile'), findsOneWidget);

      // Notifications Tile with 3 new badge
      expect(find.text('Notification Center'), findsOneWidget);
      expect(find.text('3 new'), findsOneWidget);

      // Appearance Section
      expect(find.text('Appearance'), findsOneWidget);
      expect(find.text('System'), findsOneWidget);
      expect(find.text('Light'), findsOneWidget);
      expect(find.text('Dark'), findsOneWidget);

      // Privacy & Security Section
      expect(find.text('Privacy & Security'), findsOneWidget);
      expect(find.text('Row-Level Security (RLS)'), findsOneWidget);
      expect(find.text('Encryption in Transit & Rest'), findsOneWidget);
      expect(find.text('Zero LLM Training'), findsOneWidget);

      // Data Controls Section
      expect(find.text('Data Controls'), findsOneWidget);
      expect(find.text('Clear Application Cache'), findsOneWidget);
      expect(find.text('Data Retention Policy'), findsOneWidget);
      expect(find.text('Account & Data Deletion'), findsOneWidget);

      // Sign Out Button
      expect(find.text('Sign out'), findsOneWidget);
    });

    testWidgets('appearance switcher changes themeMode on ThemeController',
        (tester) async {
      final profileService = MockProfileService(sampleProfile);
      final notificationService = MockNotificationService(0);
      final authService = MockAuthService();
      final themeController = ThemeController.testable();

      await tester.pumpWidget(
        MaterialApp(
          home: SettingsScreen(
            profileService: profileService,
            notificationService: notificationService,
            authService: authService,
            themeController: themeController,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(themeController.themeMode, ThemeMode.system);

      // Tap Dark mode segment
      await tester.tap(find.text('Dark'));
      await tester.pumpAndSettle();

      expect(themeController.themeMode, ThemeMode.dark);

      // Tap Light mode segment
      await tester.tap(find.text('Light'));
      await tester.pumpAndSettle();

      expect(themeController.themeMode, ThemeMode.light);
    });

    testWidgets('tapping privacy tile opens detail bottom sheet',
        (tester) async {
      final profileService = MockProfileService(sampleProfile);
      final notificationService = MockNotificationService(0);
      final authService = MockAuthService();
      final themeController = ThemeController.testable();

      await tester.pumpWidget(
        MaterialApp(
          home: SettingsScreen(
            profileService: profileService,
            notificationService: notificationService,
            authService: authService,
            themeController: themeController,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap RLS tile
      await tester.tap(find.text('Row-Level Security (RLS)'));
      await tester.pumpAndSettle();

      expect(find.text('Done'), findsOneWidget);
      expect(
        find.textContaining('Every database query against policies'),
        findsOneWidget,
      );

      // Tap Done to dismiss
      await tester.tap(find.text('Done'));
      await tester.pumpAndSettle();

      expect(find.text('Done'), findsNothing);
    });

    testWidgets('tapping clear cache prompts confirmation dialog',
        (tester) async {
      setTestViewport(tester);
      final profileService = MockProfileService(sampleProfile);
      final notificationService = MockNotificationService(0);
      final authService = MockAuthService();
      final themeController = ThemeController.testable();

      await tester.pumpWidget(
        MaterialApp(
          home: SettingsScreen(
            profileService: profileService,
            notificationService: notificationService,
            authService: authService,
            themeController: themeController,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Clear Application Cache
      await tester.tap(find.text('Clear Application Cache'));
      await tester.pumpAndSettle();

      expect(find.text('Clear local application cache?'), findsOneWidget);
      expect(find.text('Clear Cache'), findsOneWidget);

      // Confirm
      await tester.tap(find.text('Clear Cache'));
      await tester.pumpAndSettle();

      expect(find.text('Application cache cleared successfully'), findsOneWidget);
    });

    testWidgets('tapping account deletion shows transparent erasure notice',
        (tester) async {
      setTestViewport(tester);
      final profileService = MockProfileService(sampleProfile);
      final notificationService = MockNotificationService(0);
      final authService = MockAuthService();
      final themeController = ThemeController.testable();

      await tester.pumpWidget(
        MaterialApp(
          home: SettingsScreen(
            profileService: profileService,
            notificationService: notificationService,
            authService: authService,
            themeController: themeController,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Account & Data Deletion
      await tester.tap(find.text('Account & Data Deletion'));
      await tester.pumpAndSettle();

      expect(find.text('Understood'), findsOneWidget);
      expect(
        find.textContaining('PRISM complies with data privacy'),
        findsOneWidget,
      );

      await tester.tap(find.text('Understood'));
      await tester.pumpAndSettle();
    });

    testWidgets('tapping sign out prompts confirmation dialog and navigates to login',
        (tester) async {
      setTestViewport(tester);
      final profileService = MockProfileService(sampleProfile);
      final notificationService = MockNotificationService(0);
      final authService = MockAuthService();
      final themeController = ThemeController.testable();

      final router = GoRouter(
        initialLocation: '/settings',
        routes: [
          GoRoute(
            path: '/settings',
            builder: (context, state) => SettingsScreen(
              profileService: profileService,
              notificationService: notificationService,
              authService: authService,
              themeController: themeController,
            ),
          ),
          GoRoute(
            path: '/login',
            builder: (context, state) => const Scaffold(
              body: Text('Login Screen Destination'),
            ),
          ),
        ],
      );

      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.pumpAndSettle();

      // Tap Sign out button
      await tester.tap(find.text('Sign out'));
      await tester.pumpAndSettle();

      expect(find.text('Sign out of PRISM?'), findsOneWidget);
      expect(find.text('Cancel'), findsOneWidget);

      // Tap Sign out inside dialog
      await tester.tap(find.widgetWithText(ElevatedButton, 'Sign out'));
      await tester.pumpAndSettle();

      expect(authService.signOutCalled, isTrue);
      expect(find.text('Login Screen Destination'), findsOneWidget);
    });

    testWidgets('renders cleanly on 360px screen width without overflow',
        (tester) async {
      tester.view.physicalSize = const Size(360 * 2.0, 800 * 2.0);
      tester.view.devicePixelRatio = 2.0;

      final profileService = MockProfileService(sampleProfile);
      final notificationService = MockNotificationService(2);
      final authService = MockAuthService();
      final themeController = ThemeController.testable();

      await tester.pumpWidget(
        MaterialApp(
          home: SettingsScreen(
            profileService: profileService,
            notificationService: notificationService,
            authService: authService,
            themeController: themeController,
          ),
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
