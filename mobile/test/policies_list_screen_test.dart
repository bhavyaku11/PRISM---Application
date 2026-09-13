import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:prism_mobile/features/policies/models/policy_model.dart';
import 'package:prism_mobile/features/policies/screens/policies_list_screen.dart';

void main() {
  group('PoliciesListScreen', () {
    testWidgets('displays empty state when user has no policies',
        (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: PoliciesListScreen(
            initialPolicies: [],
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('My Policies'), findsNWidgets(2));
      expect(
        find.text('Your insurance policies, organized in one place.'),
        findsOneWidget,
      );
      expect(find.text('Your insurance starts here.'), findsOneWidget);
      expect(
        find.text(
          'Add your health insurance policy to understand your coverage, exclusions, waiting periods, and important limits.',
        ),
        findsOneWidget,
      );
      expect(find.text('Add Policy'), findsWidgets);
    });

    testWidgets('displays real policy cards with formatted INR and status',
        (tester) async {
      final samplePolicies = [
        PolicyModel(
          id: 'pol_1',
          userId: 'usr_1',
          policyName: 'Optima Secure Individual',
          insurerName: 'HDFC ERGO',
          policyNumber: 'HDFC-882199',
          policyType: 'Health',
          insuredMember: 'Bhavya Kumar',
          sumInsured: 1000000,
          premium: 14500,
          startDate: '2024-04-01',
          endDate: '2025-03-31',
          status: 'processed',
        ),
        PolicyModel(
          id: 'pol_2',
          userId: 'usr_1',
          policyName: 'Star Health Senior Care',
          insurerName: 'Star Health',
          policyNumber: 'STAR-330122',
          policyType: 'Senior',
          sumInsured: 500000,
          status: 'processing',
        ),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: PoliciesListScreen(
            initialPolicies: samplePolicies,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Optima Secure Individual'), findsOneWidget);
      expect(find.text('HDFC ERGO'), findsOneWidget);
      expect(find.text('₹10,00,000'), findsOneWidget);
      expect(find.text('Ready to explore'), findsOneWidget);

      expect(find.text('Star Health Senior Care'), findsOneWidget);
      expect(find.text('STAR HEALTH'), findsOneWidget);
      expect(find.text('₹5,00,000'), findsOneWidget);
      expect(find.text('Analyzing policy'), findsOneWidget);

      // Verify metrics summary row
      expect(find.text('Total'), findsOneWidget);
      expect(find.text('2'), findsOneWidget);
    });

    testWidgets('tapping "+ Add Policy" navigates to /policies/add',
        (tester) async {
      final router = GoRouter(
        initialLocation: '/policies',
        routes: [
          GoRoute(
            path: '/policies',
            builder: (context, state) =>
                const PoliciesListScreen(initialPolicies: []),
          ),
          GoRoute(
            path: '/policies/add',
            builder: (context, state) =>
                const Scaffold(body: Text('Add Policy Target Screen')),
          ),
        ],
      );

      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.pumpAndSettle();

      // Tap the Add Policy CTA button in empty state
      final addPolicyButton =
          find.widgetWithText(ElevatedButton, 'Add Policy').first;
      await tester.tap(addPolicyButton);
      await tester.pumpAndSettle();

      // Verify navigation to /policies/add
      expect(find.text('Add Policy Target Screen'), findsOneWidget);
    });

    testWidgets('renders properly without overflow at 360px width',
        (tester) async {
      tester.view.physicalSize = const Size(360, 800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      final samplePolicies = [
        PolicyModel(
          id: 'pol_1',
          userId: 'usr_1',
          policyName: 'Optima Secure Individual Health Plan Long Title Test',
          insurerName: 'HDFC ERGO General Insurance Company Limited',
          policyNumber: 'HDFC-882199-EXTRA-LONG-NUMBER',
          policyType: 'Comprehensive Family Floater',
          insuredMember: 'Bhavya Kumar & Family Dependents',
          sumInsured: 2500000,
          premium: 28999,
          startDate: '2024-04-01',
          endDate: '2025-03-31',
          status: 'processed',
        ),
      ];

      await tester.pumpWidget(
        MaterialApp(
          home: PoliciesListScreen(
            initialPolicies: samplePolicies,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('My Policies'), findsNWidgets(2));
    });
  });
}
