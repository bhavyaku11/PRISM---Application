import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/core/network/api_client.dart';
import 'package:prism_mobile/features/ask_prism/models/ask_models.dart';
import 'package:prism_mobile/features/ask_prism/screens/ask_screen.dart';
import 'package:prism_mobile/features/ask_prism/services/ask_service.dart';
import 'package:prism_mobile/features/policies/models/policy_model.dart';

class MockAskApiClient extends ApiClient {
  Map<String, dynamic> responseToReturn = {
    'answer': 'Your health insurance covers hospital room charges up to Single Private AC Room.',
    'grounded': true,
    'confidence': 'high',
    'conversation_id': 'conv_mock_1',
    'message_id': 'msg_mock_1',
    'citations': [
      {
        'chunk_id': 'c1',
        'page_number': 6,
        'section_title': 'Room Rent Sub-Limits',
      }
    ],
    'sources': [
      {
        'chunk_id': 's1',
        'page_number': 6,
        'section_title': 'Room Rent Sub-Limits',
        'content': 'Room rent is capped at Single Private AC Room standard category.',
        'similarity': 0.92,
      }
    ],
  };

  @override
  Future<dynamic> post(String path,
      {Map<String, dynamic>? body, Map<String, String>? headers}) async {
    return responseToReturn;
  }
}

void main() {
  group('AskScreen Widget Tests', () {
    final processedPolicy = PolicyModel(
      id: 'pol_1',
      userId: 'usr_1',
      policyName: 'Star Health Comprehensive',
      insurerName: 'Star Health',
      status: 'processed',
      policyNumber: 'STAR-8819',
    );

    final pendingPolicy = PolicyModel(
      id: 'pol_2',
      userId: 'usr_1',
      policyName: 'HDFC ERGO Optima Secure',
      insurerName: 'HDFC ERGO',
      status: 'processing',
      policyNumber: 'HDFC-4412',
    );

    final failedPolicy = PolicyModel(
      id: 'pol_3',
      userId: 'usr_1',
      policyName: 'Care Advantage',
      insurerName: 'Care Health',
      status: 'failed',
      policyNumber: 'CARE-9912',
    );

    testWidgets('renders empty state when user has 0 policies with Add Policy CTA', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: AskScreen(
            initialPolicies: [],
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Ask PRISM'), findsOneWidget);
      expect(find.text('GROUNDED'), findsOneWidget);
      expect(find.text('Add a policy to start asking PRISM'), findsOneWidget);
      expect(find.text('Add Policy'), findsOneWidget);
    });

    testWidgets('auto-selects single processed policy and displays welcome & suggested questions', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AskScreen(
            initialPolicies: [processedPolicy],
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Ask PRISM'), findsOneWidget);
      expect(find.text('Policy Scope:'), findsOneWidget);
      expect(find.text('Star Health Comprehensive (Star Health)'), findsOneWidget);
      expect(find.text('What would you like to know about your policy?'), findsOneWidget);
      expect(find.text('SUGGESTED QUESTIONS'), findsOneWidget);
      expect(find.text('Does my policy cover ICU charges?'), findsOneWidget);
      expect(find.text('What are the room rent limits?'), findsOneWidget);
      expect(find.text('Ask about your coverage...'), findsOneWidget);
    });

    testWidgets('shows warning banner and disables input when selected policy is processing', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AskScreen(
            policyId: 'pol_2',
            initialPolicies: [pendingPolicy],
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('Your policy is still being processed'), findsOneWidget);
      expect(find.text('Policy is not ready for questions...'), findsOneWidget);

      // Send button should be disabled
      final sendBtn = tester.widget<IconButton>(
        find.ancestor(
          of: find.byIcon(Icons.send_rounded),
          matching: find.byType(IconButton),
        ),
      );
      expect(sendBtn.onPressed, isNull);
    });

    testWidgets('shows warning banner when selected policy is failed', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: AskScreen(
            policyId: 'pol_3',
            initialPolicies: [failedPolicy],
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.textContaining('Document extraction for this policy failed'), findsOneWidget);
      expect(find.text('Policy is not ready for questions...'), findsOneWidget);
    });

    testWidgets('asks question and displays grounded answer with citations and evidence', (tester) async {
      final mockApi = MockAskApiClient();
      final askService = AskService(apiClient: mockApi);

      await tester.pumpWidget(
        MaterialApp(
          home: AskScreen(
            initialPolicies: [processedPolicy],
            askService: askService,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Enter question in TextField
      final textField = find.byType(TextField);
      await tester.enterText(textField, 'What is the room rent limit?');
      await tester.pump();

      // Tap send button
      await tester.tap(find.byTooltip('Send question'));
      await tester.pump(); // show loading bubble & user message
      await tester.pumpAndSettle(); // finish response

      // Verify User Message
      expect(find.text('What is the room rent limit?'), findsOneWidget);

      // Verify Assistant Message
      expect(find.text('PRISM Response'), findsOneWidget);
      expect(find.text('Grounded in Policy'), findsOneWidget);
      expect(find.textContaining('covers hospital room charges up to Single Private AC Room'), findsOneWidget);

      // Verify Citations & Evidence
      expect(find.text('VERIFIED POLICY CITATIONS'), findsOneWidget);
      expect(find.text('Page 6'), findsOneWidget);
      expect(find.text('Room Rent Sub-Limits'), findsOneWidget);
      expect(find.text('View 1 Retrieved Policy Evidence Excerpt'), findsOneWidget);
    });

    testWidgets('displays Insufficient Evidence badge when response is not grounded', (tester) async {
      final mockApi = MockAskApiClient();
      mockApi.responseToReturn = {
        'answer': 'I could not find sufficient evidence regarding overseas dental treatment in your policy.',
        'grounded': false,
        'confidence': 'low',
        'conversation_id': 'conv_mock_2',
        'message_id': 'msg_mock_2',
        'citations': [],
        'sources': [],
      };
      final askService = AskService(apiClient: mockApi);

      await tester.pumpWidget(
        MaterialApp(
          home: AskScreen(
            initialPolicies: [processedPolicy],
            askService: askService,
          ),
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextField), 'Is overseas dental covered?');
      await tester.pump();
      await tester.tap(find.byTooltip('Send question'));
      await tester.pumpAndSettle();

      expect(find.text('Insufficient Evidence'), findsOneWidget);
      expect(find.textContaining('I could not find sufficient evidence'), findsOneWidget);
    });

    testWidgets('tapping suggested question sends it immediately', (tester) async {
      final mockApi = MockAskApiClient();
      final askService = AskService(apiClient: mockApi);

      await tester.pumpWidget(
        MaterialApp(
          home: AskScreen(
            initialPolicies: [processedPolicy],
            askService: askService,
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap suggested question
      await tester.tap(find.text('Does my policy cover ICU charges?'));
      await tester.pump();
      await tester.pumpAndSettle();

      expect(find.text('Does my policy cover ICU charges?'), findsOneWidget);
      expect(find.text('PRISM Response'), findsOneWidget);
    });

    testWidgets('renders cleanly at 360px width without overflow', (tester) async {
      tester.view.physicalSize = const Size(360, 800);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      final mockApi = MockAskApiClient();
      final askService = AskService(apiClient: mockApi);

      await tester.pumpWidget(
        MaterialApp(
          home: AskScreen(
            initialPolicies: [processedPolicy],
            askService: askService,
            initialMessages: [
              ChatMessageModel(
                id: 'm1',
                role: 'user',
                content: 'Does my policy have a co-pay?',
                createdAt: DateTime.now(),
              ),
              ChatMessageModel(
                id: 'm2',
                role: 'assistant',
                content: 'Your policy does not require any mandatory co-payment for network hospitals.',
                grounded: true,
                confidence: 'high',
                citations: [
                  const CitationModel(
                    chunkId: 'c1',
                    pageNumber: 8,
                    sectionTitle: 'Co-Payment Terms and Zone Rules',
                  ),
                ],
                sources: [
                  const SourceModel(
                    chunkId: 's1',
                    pageNumber: 8,
                    sectionTitle: 'Co-Payment Terms and Zone Rules',
                    content: 'No co-payment shall apply to claims in Zone 1 network hospitals.',
                    similarity: 0.95,
                  ),
                ],
                createdAt: DateTime.now(),
              ),
            ],
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Ask PRISM'), findsOneWidget);
      expect(find.text('Does my policy have a co-pay?'), findsOneWidget);
      expect(find.text('Grounded in Policy'), findsOneWidget);
      expect(find.text('Page 8'), findsOneWidget);
    });
  });
}
