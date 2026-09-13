import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/app/theme.dart';
import 'package:prism_mobile/features/auth/screens/login_screen.dart';

void main() {
  testWidgets('LoginScreen renders PRISM branding and input fields',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: PrismTheme.lightTheme,
        home: const LoginScreen(),
      ),
    );

    // Verify brand icon and title
    expect(find.byIcon(Icons.shield_outlined), findsOneWidget);
    expect(find.text('Welcome back'), findsOneWidget);

    // Verify input fields
    expect(find.byType(TextFormField), findsNWidgets(2));
    expect(find.text('Email address'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);

    // Verify sign in button
    expect(find.text('Sign in'), findsOneWidget);
  });
}
