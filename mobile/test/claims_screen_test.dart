import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:prism_mobile/features/claims/models/claim_model.dart';
import 'package:prism_mobile/features/claims/screens/claims_screen.dart';
import 'package:prism_mobile/features/policies/models/policy_model.dart';

void main() {
  final samplePolicy = PolicyModel(
    id: 'pol_hdfc_01',
    userId: 'usr_1',
    policyName: 'HDFC ERGO Optima Secure',
    insurerName: 'HDFC ERGO',
    policyNumber: 'HDFC-991288',
    policyType: 'Health',
    insuredMember: 'Bhavya Kumar',
    sumInsured: 1000000,
    status: 'processed',
  );

  final sampleClaims = [
    ClaimModel(
      id: 'claim_1',
      userId: 'usr_1',
      policyId: 'pol_hdfc_01',
      claimName: 'Emergency Appendectomy',
      claimType: 'Hospitalization',
      insuredMember: 'Aarav Kumar',
      hospitalName: 'Apollo Hospitals, Greams Road',
      admissionDate: '2024-11-10',
      dischargeDate: '2024-11-14',
      estimatedExpense: 185000,
      currency: 'INR',
      status: 'preparing',
      preparationProgress: 45,
      notes: 'Initial documents gathered',
      policy: samplePolicy,
    ),
    ClaimModel(
      id: 'claim_2',
      userId: 'usr_1',
      policyId: 'pol_hdfc_01',
      claimName: 'Cataract Surgery',
      claimType: 'Day Care',
      insuredMember: 'Meera Kumar',
      hospitalName: 'Sankara Nethralaya',
      admissionDate: '2024-12-01',
      dischargeDate: '2024-12-01',
      estimatedExpense: 42000,
      currency: 'INR',
      status: 'review',
      preparationProgress: 85,
      policy: samplePolicy,
    ),
  ];

  group('ClaimsScreen Widget Tests', () {
    testWidgets('renders header, supporting text, and empty state when 0 claims',
        (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: ClaimsScreen(
            initialClaims: [],
            initialPolicies: [],
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Header and supporting text
      expect(find.text('Claims Center'), findsNWidgets(2)); // AppBar + title header
      expect(
        find.text(
          'Prepare your claim with the documents and policy evidence you may need.',
        ),
        findsOneWidget,
      );

      // Empty State
      expect(find.text('Be prepared before you file a claim.'), findsOneWidget);
      expect(
        find.text(
          'Create a claim workspace to organize your documents and review relevant policy evidence.',
        ),
        findsOneWidget,
      );

      // Prepare a Claim CTA
      expect(find.text('Prepare a Claim'), findsWidgets);
    });

    testWidgets('renders real claim cards, statistics bar, and metadata',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ClaimsScreen(
            initialClaims: sampleClaims,
            initialPolicies: [samplePolicy],
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify statistics row
      expect(find.text('ACTIVE CLAIMS'), findsOneWidget);
      expect(find.text('Preparing'), findsWidgets);
      expect(find.text('Ready for Review'), findsWidgets);

      // Verify Claim 1 cards content
      expect(find.text('Emergency Appendectomy'), findsOneWidget);
      expect(find.textContaining('HDFC ERGO Optima Secure'), findsWidgets);
      expect(find.text('Apollo Hospitals, Greams Road'), findsOneWidget);
      expect(find.text('₹1,85,000'), findsOneWidget);
      expect(find.text('45%'), findsOneWidget);

      // Verify Claim 2 cards content
      expect(find.text('Cataract Surgery'), findsOneWidget);
      expect(find.text('Sankara Nethralaya'), findsOneWidget);
      expect(find.text('₹42,000'), findsOneWidget);
      expect(find.text('85%'), findsOneWidget);
    });

    testWidgets('tapping a claim navigates to /claims/:id', (tester) async {
      final router = GoRouter(
        initialLocation: '/claims',
        routes: [
          GoRoute(
            path: '/claims',
            builder: (context, state) => ClaimsScreen(
              initialClaims: sampleClaims,
              initialPolicies: [samplePolicy],
            ),
          ),
          GoRoute(
            path: '/claims/:id',
            builder: (context, state) => Scaffold(
              body: Text('Claim Detail: ${state.pathParameters['id']}'),
            ),
          ),
        ],
      );

      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.pumpAndSettle();

      // Tap first claim card
      final firstClaim = find.text('Emergency Appendectomy');
      expect(firstClaim, findsOneWidget);
      await tester.tap(firstClaim);
      await tester.pumpAndSettle();

      // Verify navigation occurred with correct ID
      expect(find.text('Claim Detail: claim_1'), findsOneWidget);
    });

    testWidgets('renders cleanly without overflow at 360px width',
        (tester) async {
      tester.view.physicalSize = const Size(360, 800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        MaterialApp(
          home: ClaimsScreen(
            initialClaims: sampleClaims,
            initialPolicies: [samplePolicy],
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('Claims Center'), findsNWidgets(2));
      expect(find.text('Emergency Appendectomy'), findsOneWidget);
    });
  });
}
