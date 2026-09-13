import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:prism_mobile/features/claims/models/claim_model.dart';
import 'package:prism_mobile/features/claims/screens/claim_detail_screen.dart';
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

  final sampleClaim = ClaimModel(
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
    notes: 'Awaiting doctor signature on discharge paper',
    policy: samplePolicy,
  );

  final sampleDocs = [
    const ClaimDocumentModel(
      id: 'cdoc_1',
      userId: 'usr_1',
      claimId: 'claim_1',
      documentId: 'doc_1',
      documentName: 'discharge_summary.pdf',
      documentType: 'discharge_summary',
      fileSize: 1200000,
      notes: '[discharge_summary] Signed by Dr. Ramesh',
    ),
  ];

  final sampleEvidence = [
    const PolicyEvidenceItem(
      chunkId: 'chk_1',
      policyId: 'pol_hdfc_01',
      pageNumber: 14,
      sectionTitle: 'Inpatient Hospitalization & Room Rent',
      content:
          'Medical expenses incurred for hospitalisation exceeding 24 hours are covered up to the sum insured.',
      similarity: 0.89,
      whyItMatters:
          'This clause confirms room rent eligibility and daily capping limits for your hospital stay.',
    ),
  ];

  void setDefaultViewport(WidgetTester tester) {
    tester.view.physicalSize = const Size(1200, 1600);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());
  }

  group('ClaimDetailScreen Widget Tests', () {
    testWidgets('renders workspace header, progress gauge, and summary tab',
        (tester) async {
      setDefaultViewport(tester);

      await tester.pumpWidget(
        MaterialApp(
          home: ClaimDetailScreen(
            claimId: 'claim_1',
            initialClaim: sampleClaim,
            initialDocuments: sampleDocs,
            initialEvidence: sampleEvidence,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Header info
      expect(find.text('Emergency Appendectomy'), findsWidgets);
      expect(find.text('HDFC ERGO Optima Secure'), findsWidgets);
      expect(find.text('Preparing'), findsWidgets);

      // 5 Tabs present
      expect(find.text('1. Understand'), findsOneWidget);
      expect(find.text('2. Documents'), findsOneWidget);
      expect(find.text('3. Policy Evidence'), findsOneWidget);
      expect(find.text('4. Prepare / Review'), findsOneWidget);
      expect(find.text('5. Tracking'), findsOneWidget);

      // Understand tab contents
      expect(find.text('CLAIM SUMMARY'), findsOneWidget);
      expect(find.text('Apollo Hospitals, Greams Road'), findsOneWidget);
      expect(find.text('Aarav Kumar'), findsOneWidget);
      expect(find.text('₹1,85,000'), findsOneWidget);
      expect(find.textContaining('PREPARATION NOTES'), findsOneWidget);
      expect(
        find.text('Awaiting doctor signature on discharge paper'),
        findsOneWidget,
      );

      // Contextual Ask PRISM card
      expect(find.text('Ask PRISM About This Claim'), findsOneWidget);
    });

    testWidgets('switching to Documents tab displays checklist items and statuses',
        (tester) async {
      setDefaultViewport(tester);

      await tester.pumpWidget(
        MaterialApp(
          home: ClaimDetailScreen(
            claimId: 'claim_1',
            initialClaim: sampleClaim,
            initialDocuments: sampleDocs,
            initialEvidence: sampleEvidence,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap tab 2
      await tester.tap(find.text('2. Documents'));
      await tester.pumpAndSettle();

      // Mandatory document names
      expect(find.text('Discharge Summary'), findsWidgets);
      expect(find.text('Hospital Final Bill & Tax Invoice'), findsWidgets);
      expect(find.text('Claim Form (Part A & Part B)'), findsWidgets);
      expect(find.text('Diagnostic & Lab Reports'), findsWidgets);

      // Ready vs Required statuses
      expect(find.text('READY'), findsWidgets);
      expect(find.text('REQUIRED'), findsWidgets);
    });

    testWidgets('switching to Policy Evidence tab shows clause and citation',
        (tester) async {
      setDefaultViewport(tester);

      await tester.pumpWidget(
        MaterialApp(
          home: ClaimDetailScreen(
            claimId: 'claim_1',
            initialClaim: sampleClaim,
            initialDocuments: sampleDocs,
            initialEvidence: sampleEvidence,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap tab 3
      await tester.tap(find.text('3. Policy Evidence'));
      await tester.pumpAndSettle();

      // Check evidence content
      expect(
        find.text('Inpatient Hospitalization & Room Rent'),
        findsOneWidget,
      );
      expect(find.text('Page 14'), findsOneWidget);
      expect(find.textContaining('89'), findsWidgets);
      expect(
        find.text(
          'This clause confirms room rent eligibility and daily capping limits for your hospital stay.',
        ),
        findsOneWidget,
      );
    });

    testWidgets('switching to Prepare / Review tab shows readiness and disclaimer',
        (tester) async {
      setDefaultViewport(tester);

      await tester.pumpWidget(
        MaterialApp(
          home: ClaimDetailScreen(
            claimId: 'claim_1',
            initialClaim: sampleClaim,
            initialDocuments: sampleDocs,
            initialEvidence: sampleEvidence,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap tab 4
      await tester.tap(find.text('4. Prepare / Review'));
      await tester.pumpAndSettle();

      // Review contents
      expect(find.text('SUBMISSION CHECKLIST'), findsOneWidget);
      expect(
        find.text('PRISM Preparation Notice'),
        findsOneWidget,
      );
    });

    testWidgets('switching to Tracking tab shows informational preparation notice',
        (tester) async {
      setDefaultViewport(tester);

      await tester.pumpWidget(
        MaterialApp(
          home: ClaimDetailScreen(
            claimId: 'claim_1',
            initialClaim: sampleClaim,
            initialDocuments: sampleDocs,
            initialEvidence: sampleEvidence,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap tab 5
      await tester.tap(find.text('5. Tracking'));
      await tester.pumpAndSettle();

      // Tracking tab informational notice
      expect(find.text('Submission & Tracking Guidance'), findsOneWidget);
      expect(
        find.textContaining('PRISM assists in organizing documentation'),
        findsOneWidget,
      );
    });

    testWidgets('tapping contextual Ask PRISM navigates to /ask with query',
        (tester) async {
      setDefaultViewport(tester);

      final router = GoRouter(
        initialLocation: '/claims/claim_1',
        routes: [
          GoRoute(
            path: '/claims/:id',
            builder: (context, state) => ClaimDetailScreen(
              claimId: state.pathParameters['id']!,
              initialClaim: sampleClaim,
              initialDocuments: sampleDocs,
              initialEvidence: sampleEvidence,
            ),
          ),
          GoRoute(
            path: '/ask',
            builder: (context, state) => Scaffold(
              body: Text(
                'Ask Target: pol=${state.uri.queryParameters['policy_id']} q=${state.uri.queryParameters['q']}',
              ),
            ),
          ),
        ],
      );

      await tester.pumpWidget(MaterialApp.router(routerConfig: router));
      await tester.pumpAndSettle();

      // Find first contextual prompt
      final firstPrompt =
          find.text('What documents does my policy require for reimbursement claims?');
      expect(firstPrompt, findsOneWidget);

      await tester.tap(firstPrompt);
      await tester.pumpAndSettle();

      // Verify navigation to /ask with context
      expect(
        find.textContaining('Ask Target: pol=pol_hdfc_01'),
        findsOneWidget,
      );
    });

    testWidgets('renders cleanly without overflow at 360px width',
        (tester) async {
      tester.view.physicalSize = const Size(360, 800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        MaterialApp(
          home: ClaimDetailScreen(
            claimId: 'claim_1',
            initialClaim: sampleClaim,
            initialDocuments: sampleDocs,
            initialEvidence: sampleEvidence,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('CLAIM SUMMARY'), findsOneWidget);
    });
  });
}
