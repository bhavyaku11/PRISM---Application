import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/app/theme.dart';
import 'package:prism_mobile/features/dashboard/models/dashboard_data.dart';
import 'package:prism_mobile/features/dashboard/screens/dashboard_screen.dart';
import 'package:prism_mobile/features/policies/models/policy_model.dart';

void main() {
  group('DashboardScreen', () {
    testWidgets('shows loading indicator when isLoading is true',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: PrismTheme.lightTheme,
          home: DashboardScreen(initialData: DashboardData.initial()),
        ),
      );

      // Verify PRISM Top Bar branding & loading spinner
      expect(find.text('PRISM'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('renders empty state when user has no policies',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);

      final emptyData = DashboardData(
        userName: 'Alex',
        policies: [],
        activeClaimsCount: 0,
        unreadNotificationsCount: 0,
        isLoading: false,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: PrismTheme.lightTheme,
          home: DashboardScreen(initialData: emptyData),
        ),
      );
      await tester.pump();

      // Verify header greeting
      expect(find.text('Hello, Alex'), findsOneWidget);

      // Verify intelligence card
      expect(find.text('Ask PRISM Intelligence'), findsOneWidget);
      expect(find.text('Ask a question'), findsOneWidget);

      // Verify metrics
      expect(find.text('Active Policies'), findsOneWidget);
      expect(find.text('Claims Filed'), findsOneWidget);

      // Verify empty state prompt
      expect(find.text('Add your first policy'), findsOneWidget);
      expect(find.text('Intelligence Tools'), findsOneWidget);
    });

    testWidgets('renders policy card when user has active policies',
        (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);

      final samplePolicy = PolicyModel(
        id: 'pol-123',
        userId: 'usr-1',
        policyName: 'HDFC ERGO Optima Secure',
        insurerName: 'HDFC ERGO General Insurance',
        policyNumber: 'HDFC-88990',
        policyType: 'Health',
        sumInsured: 1000000,
        startDate: '2024-01-01',
        endDate: '2025-01-01',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
      );

      final populatedData = DashboardData(
        userName: 'Alex',
        policies: [samplePolicy],
        activeClaimsCount: 1,
        unreadNotificationsCount: 2,
        isLoading: false,
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: PrismTheme.lightTheme,
          home: DashboardScreen(initialData: populatedData),
        ),
      );
      await tester.pump();

      // Verify policy card elements
      expect(find.text('HDFC ERGO Optima Secure'), findsOneWidget);
      expect(find.text('HDFC ERGO General Insurance'), findsOneWidget);
      expect(find.text('Active'), findsOneWidget);
      expect(find.text('2025-01-01'), findsOneWidget);
    });
  });
}
