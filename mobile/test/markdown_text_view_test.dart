import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/ask_prism/widgets/markdown_text_view.dart';

void main() {
  group('MarkdownTextView Widget Tests', () {
    testWidgets('renders headers, bullet lists, and paragraphs', (tester) async {
      const markdown = '''
### Coverage Details
Your health policy includes:
- In-patient hospitalization
- Day care procedures
1. Submit pre-auth 48h in advance
2. Provide cashless card at TPA desk
''';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: MarkdownTextView(text: markdown),
          ),
        ),
      );

      expect(find.text('Coverage Details'), findsOneWidget);
      expect(find.text('Your health policy includes:'), findsOneWidget);
      expect(find.text('In-patient hospitalization'), findsOneWidget);
      expect(find.text('Day care procedures'), findsOneWidget);
      expect(find.text('Submit pre-auth 48h in advance'), findsOneWidget);
      expect(find.text('Provide cashless card at TPA desk'), findsOneWidget);
    });

    testWidgets('renders bold and italic inline spans correctly', (tester) async {
      const markdown = 'Your room rent is **capped at ₹5,000/day** or *1% of SI*.';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: MarkdownTextView(text: markdown),
          ),
        ),
      );

      final richTextFinder = find.byType(RichText);
      expect(richTextFinder, findsWidgets);

      final richText = tester.widget<RichText>(richTextFinder.first);
      final textSpan = richText.text as TextSpan;
      expect(textSpan.children, isNotEmpty);
      expect(textSpan.toPlainText(), contains('capped at ₹5,000/day'));
    });
  });
}
