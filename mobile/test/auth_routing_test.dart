import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/app/router.dart';
import 'package:prism_mobile/app/theme.dart';

void main() {
  group('Authentication Routing', () {
    testWidgets(
        'unauthenticated user trying to access /dashboard redirects to /login',
        (WidgetTester tester) async {
      // In a fresh test environment without active session, createRouter should redirect to /login
      final router = createRouter(initialLocation: '/dashboard');

      await tester.pumpWidget(
        MaterialApp.router(
          theme: PrismTheme.lightTheme,
          routerConfig: router,
        ),
      );
      await tester.pumpAndSettle();

      // Should be redirected to Login screen
      expect(find.text('Welcome back'), findsOneWidget);
      expect(find.text('Sign in'), findsOneWidget);
    });

    testWidgets('/signup route renders signup screen',
        (WidgetTester tester) async {
      final router = createRouter(initialLocation: '/signup');

      await tester.pumpWidget(
        MaterialApp.router(
          theme: PrismTheme.lightTheme,
          routerConfig: router,
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Create account'), findsOneWidget);
      expect(find.text('Full Name'), findsOneWidget);
    });
  });
}
