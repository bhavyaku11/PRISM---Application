import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/policies/models/policy_model.dart';
import 'package:prism_mobile/features/policies/models/policy_section_model.dart';
import 'package:prism_mobile/features/policies/screens/policy_detail_screen.dart';

void main() {
  group('PolicyDetailScreen', () {
    final samplePolicy = PolicyModel(
      id: 'pol_101',
      userId: 'usr_abc',
      policyName: 'Care Supreme Health Insurance',
      insurerName: 'Care Health',
      policyNumber: 'CARE-100293',
      policyType: 'Individual',
      insuredMember: 'Bhavya Kumar',
      sumInsured: 1500000,
      premium: 16200,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'processed',
      understandingScore: 92,
    );

    final sampleSections = [
      PolicySectionModel(
        id: 'sec_cov_1',
        userId: 'usr_abc',
        policyId: 'pol_101',
        sectionType: 'coverage',
        title: 'In-Patient Hospitalization',
        content:
            'Medical expenses incurred for hospital room, nursing charges, surgery, and ICU care for minimum 24 hours.',
        pageStart: 3,
        pageEnd: 4,
        confidence: 0.95,
      ),
      PolicySectionModel(
        id: 'sec_wp_1',
        userId: 'usr_abc',
        policyId: 'pol_101',
        sectionType: 'waiting_period',
        title: 'Initial 30 Days Waiting Period',
        content:
            'A waiting period of 30 days from policy commencement shall apply before any claim for illness is payable.',
        pageStart: 8,
        pageEnd: 8,
        confidence: 0.90,
      ),
      PolicySectionModel(
        id: 'sec_exc_1',
        userId: 'usr_abc',
        policyId: 'pol_101',
        sectionType: 'exclusions',
        title: 'Permanent Exclusion of Cosmetic Treatment',
        content:
            'Expenses related to any treatment or surgery for cosmetic reasons are strictly not covered.',
        pageStart: 14,
        pageEnd: 15,
        confidence: 0.88,
      ),
      PolicySectionModel(
        id: 'sec_lim_1',
        userId: 'usr_abc',
        policyId: 'pol_101',
        sectionType: 'limits',
        title: 'Room Rent Sub-Limit',
        content:
            'Room rent is capped at Single Private Room standard AC or 1% of Sum Insured.',
        pageStart: 6,
        pageEnd: 6,
        confidence: 0.91,
      ),
    ];

    testWidgets(
        'renders processed policy with summary, insights, and real evidence sections',
        (tester) async {
      tester.view.physicalSize = const Size(400, 2000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        MaterialApp(
          home: PolicyDetailScreen(
            policyId: 'pol_101',
            initialPolicy: samplePolicy,
            initialSections: sampleSections,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify Header & Insurer
      expect(find.text('Care Supreme Health Insurance'), findsWidgets);
      expect(find.text('CARE HEALTH'), findsOneWidget);
      expect(find.text('Ready to explore'), findsOneWidget);

      // Verify Summary Card
      expect(find.text('POLICY SUMMARY'), findsOneWidget);
      expect(find.text('₹15,00,000'), findsOneWidget);
      expect(find.text('CARE-100293'), findsOneWidget);
      expect(find.text('Bhavya Kumar'), findsOneWidget);

      // Verify Neutral Policy Insights (INFO, ATTENTION, IMPORTANT)
      expect(find.text('POLICY INSIGHTS'), findsOneWidget);
      expect(find.text('Clause Parsing & Indexing Complete'), findsOneWidget);
      expect(find.text('Waiting Period Timeline Applies'), findsOneWidget);

      // Verify Extracted Sections
      expect(find.text('In-Patient Hospitalization'), findsOneWidget);
      expect(find.text('Pages 3–4'), findsOneWidget);
      expect(find.text('Initial 30 Days Waiting Period'), findsOneWidget);
      expect(find.text('Permanent Exclusion of Cosmetic Treatment'),
          findsOneWidget);
      // Scroll down to view limits section
      await tester.drag(find.byType(ListView), const Offset(0, -500));
      await tester.pumpAndSettle();
      expect(find.text('Room Rent Sub-Limit'), findsOneWidget);

      // Verify Ask PRISM CTA
      expect(find.text('Ask PRISM'), findsOneWidget);
      expect(find.text('Have a question about this policy?'), findsOneWidget);
    });

    testWidgets(
        'tapping "View source wording" opens evidence modal with verbatim clause',
        (tester) async {
      tester.view.physicalSize = const Size(400, 2000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        MaterialApp(
          home: PolicyDetailScreen(
            policyId: 'pol_101',
            initialPolicy: samplePolicy,
            initialSections: sampleSections,
          ),
        ),
      );
      await tester.pumpAndSettle();

      final viewSourceButton = find.text('View source wording').first;
      await tester.tap(viewSourceButton);
      await tester.pumpAndSettle();

      expect(
        find.text('ORIGINAL POLICY WORDING (VERBATIM EXTRACTED TEXT)'),
        findsOneWidget,
      );
      expect(
        find.textContaining('Medical expenses incurred for hospital room'),
        findsWidgets,
      );
    });

    testWidgets(
        'shows processing banner and no fake coverage when policy is processing',
        (tester) async {
      tester.view.physicalSize = const Size(400, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      final processingPolicy = PolicyModel(
        id: 'pol_proc',
        userId: 'usr_abc',
        policyName: 'Processing Health Plan',
        insurerName: 'HDFC ERGO',
        sumInsured: 1000000,
        status: 'processing',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: PolicyDetailScreen(
            policyId: 'pol_proc',
            initialPolicy: processingPolicy,
            initialSections: const [],
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('Your policy is being analyzed'), findsOneWidget);
      expect(find.text('Detailed Clauses Being Indexed'), findsOneWidget);
      expect(find.text('Analyzing policy'), findsOneWidget);
      expect(find.text('In-Patient Hospitalization'), findsNothing);
    });

    testWidgets('shows failed banner when policy processing failed',
        (tester) async {
      final failedPolicy = PolicyModel(
        id: 'pol_fail',
        userId: 'usr_abc',
        policyName: 'Failed Policy Sample',
        status: 'failed',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: PolicyDetailScreen(
            policyId: 'pol_fail',
            initialPolicy: failedPolicy,
            initialSections: const [],
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text("We couldn't finish processing this policy"),
          findsOneWidget);
      expect(find.text('Needs attention'), findsOneWidget);
    });

    testWidgets('shows fallback when policy sections are empty',
        (tester) async {
      tester.view.physicalSize = const Size(400, 2000);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        MaterialApp(
          home: PolicyDetailScreen(
            policyId: 'pol_101',
            initialPolicy: samplePolicy,
            initialSections: const [],
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(
        find.text('Not available in the processed policy evidence.'),
        findsWidgets,
      );
    });

    testWidgets('shows error or not found state cleanly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: PolicyDetailScreen(
            policyId: 'nonexistent',
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));

      expect(find.text('Policy Not Found'), findsOneWidget);
      expect(find.text('Return to My Policies'), findsOneWidget);
    });

    testWidgets('renders cleanly at 360px width without overflow',
        (tester) async {
      tester.view.physicalSize = const Size(360, 800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        MaterialApp(
          home: PolicyDetailScreen(
            policyId: 'pol_101',
            initialPolicy: samplePolicy,
            initialSections: sampleSections,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('Care Supreme Health Insurance'), findsWidgets);
    });
  });
}
