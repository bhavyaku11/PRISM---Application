import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/ask_prism/models/ask_models.dart';
import 'package:prism_mobile/features/ask_prism/widgets/evidence_card.dart';

void main() {
  group('EvidenceCard Widget Tests', () {
    final sampleCitations = [
      const CitationModel(
        chunkId: 'c1',
        pageNumber: 4,
        sectionTitle: 'Waiting Periods',
      ),
      const CitationModel(
        chunkId: 'c2',
        pageNumber: 11,
        sectionTitle: 'Permanent Exclusions',
      ),
    ];

    final sampleSources = [
      const SourceModel(
        chunkId: 's1',
        pageNumber: 4,
        sectionTitle: 'Waiting Periods',
        content: 'Pre-existing diseases are covered after 24 months of continuous coverage.',
        similarity: 0.912,
      ),
      const SourceModel(
        chunkId: 's2',
        pageNumber: 11,
        sectionTitle: 'Permanent Exclusions',
        content: 'Cosmetic surgery and weight loss treatments are permanently excluded.',
        similarity: 0.884,
      ),
    ];

    testWidgets('renders citations chips with page and section', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EvidenceCard(
              citations: sampleCitations,
              sources: sampleSources,
            ),
          ),
        ),
      );

      expect(find.text('VERIFIED POLICY CITATIONS'), findsOneWidget);
      expect(find.text('Page 4'), findsOneWidget);
      expect(find.text('Waiting Periods'), findsOneWidget);
      expect(find.text('Page 11'), findsOneWidget);
      expect(find.text('Permanent Exclusions'), findsOneWidget);
      expect(find.text('View 2 Retrieved Policy Evidence Excerpts'), findsOneWidget);
    });

    testWidgets('expands drawer on tap and displays match score & excerpt content', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: EvidenceCard(
                citations: sampleCitations,
                sources: sampleSources,
              ),
            ),
          ),
        ),
      );

      // Tap drawer trigger
      await tester.tap(find.text('View 2 Retrieved Policy Evidence Excerpts'));
      await tester.pumpAndSettle();

      expect(find.text('Hide 2 Retrieved Policy Evidence Excerpts'), findsOneWidget);
      expect(find.text('91.2% match'), findsOneWidget);
      expect(find.text('88.4% match'), findsOneWidget);
      expect(find.textContaining('Pre-existing diseases are covered'), findsOneWidget);
      expect(find.text('View full clause excerpt →'), findsNWidgets(2));
    });

    testWidgets('opens modal with verbatim clause when View full clause excerpt is tapped', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: EvidenceCard(
                citations: sampleCitations,
                sources: sampleSources,
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('View 2 Retrieved Policy Evidence Excerpts'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('View full clause excerpt →').first);
      await tester.pumpAndSettle();

      // Check modal has opened
      expect(find.text('Page 4 · 91.2% match'), findsOneWidget);
      expect(find.text('Close'), findsOneWidget);

      // Dismiss modal
      await tester.tap(find.text('Close'));
      await tester.pumpAndSettle();
      expect(find.text('Page 4 · 91.2% match'), findsNothing);
    });
  });
}
