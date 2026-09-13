import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:prism_mobile/app/app.dart';
import 'package:prism_mobile/features/auth/screens/splash_screen.dart';

void main() {
  testWidgets('PrismApp starts and renders initial screen',
      (WidgetTester tester) async {
    final testRouter = GoRouter(
      initialLocation: '/splash',
      routes: [
        GoRoute(
          path: '/splash',
          builder: (context, state) => const SplashScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) =>
              const Scaffold(body: Text('Login Screen Mock')),
        ),
      ],
    );

    await tester.pumpWidget(PrismApp(router: testRouter));

    // Verify Splash Screen PRISM branding
    expect(find.text('PRISM'), findsOneWidget);
    expect(find.text('Your Health Policy Companion'), findsOneWidget);
    expect(find.byIcon(Icons.shield_outlined), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    // Advance timer past the 600ms splash delay to settle timers
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle();
  });
}
