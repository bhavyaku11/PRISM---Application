import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/core/errors/app_error.dart';
import 'package:prism_mobile/core/network/api_client.dart';
import 'package:prism_mobile/features/ask_prism/models/ask_models.dart';
import 'package:prism_mobile/features/ask_prism/services/ask_service.dart';

class MockApiClient extends ApiClient {
  dynamic postResponse;
  dynamic postError;
  String? lastEndpoint;
  Map<String, dynamic>? lastBody;

  @override
  Future<dynamic> post(String path,
      {Map<String, dynamic>? body, Map<String, String>? headers}) async {
    lastEndpoint = path;
    lastBody = body;
    if (postError != null) throw postError;
    return postResponse;
  }
}

void main() {
  group('Ask PRISM Models', () {
    test('CitationModel serialization & deserialization', () {
      final json = {
        'chunk_id': 'chk_123',
        'document_id': 'doc_456',
        'policy_id': 'pol_789',
        'page_number': 4,
        'section_title': 'Waiting Period Clause',
      };

      final citation = CitationModel.fromJson(json);
      expect(citation.chunkId, 'chk_123');
      expect(citation.documentId, 'doc_456');
      expect(citation.policyId, 'pol_789');
      expect(citation.pageNumber, 4);
      expect(citation.sectionTitle, 'Waiting Period Clause');

      final serialized = citation.toJson();
      expect(serialized['chunk_id'], 'chk_123');
      expect(serialized['page_number'], 4);
      expect(serialized['section_title'], 'Waiting Period Clause');
    });

    test('SourceModel serialization & deserialization', () {
      final json = {
        'chunk_id': 'src_101',
        'document_id': 'doc_202',
        'policy_id': 'pol_303',
        'page_number': 12,
        'section_title': 'Room Rent Limits',
        'content': 'Room rent charges are capped at 1% of Sum Insured.',
        'similarity': 0.892,
      };

      final source = SourceModel.fromJson(json);
      expect(source.chunkId, 'src_101');
      expect(source.pageNumber, 12);
      expect(source.sectionTitle, 'Room Rent Limits');
      expect(source.content, contains('1% of Sum Insured'));
      expect(source.similarity, closeTo(0.892, 0.001));

      final serialized = source.toJson();
      expect(serialized['similarity'], closeTo(0.892, 0.001));
    });

    test('AskResponseModel parses grounded response with citations and sources', () {
      final json = {
        'answer': 'Your policy covers ICU charges without any sub-limit.',
        'grounded': true,
        'confidence': 'high',
        'conversation_id': 'conv_123',
        'message_id': 'msg_456',
        'citations': [
          {
            'chunk_id': 'chk_1',
            'page_number': 5,
            'section_title': 'ICU Coverage',
          }
        ],
        'sources': [
          {
            'chunk_id': 'src_1',
            'page_number': 5,
            'section_title': 'ICU Coverage',
            'content': 'No capping on ICU charges up to Sum Insured.',
            'similarity': 0.94,
          }
        ],
      };

      final response = AskResponseModel.fromJson(json);
      expect(response.answer, contains('covers ICU charges'));
      expect(response.grounded, true);
      expect(response.confidence, 'high');
      expect(response.conversationId, 'conv_123');
      expect(response.messageId, 'msg_456');
      expect(response.citations.length, 1);
      expect(response.citations.first.pageNumber, 5);
      expect(response.sources.length, 1);
      expect(response.sources.first.similarity, closeTo(0.94, 0.001));
    });

    test('ChatMessageModel parses user and assistant messages properly', () {
      final userJson = {
        'id': 'msg_usr_1',
        'role': 'user',
        'content': 'What is the sum insured?',
        'created_at': '2024-05-01T10:00:00.000Z',
      };
      final userMsg = ChatMessageModel.fromJson(userJson);
      expect(userMsg.isUser, true);
      expect(userMsg.isAssistant, false);
      expect(userMsg.content, 'What is the sum insured?');

      final asstJson = {
        'id': 'msg_asst_1',
        'role': 'assistant',
        'content': 'The sum insured under your policy is ₹15,00,000.',
        'grounded': true,
        'confidence': 'high',
        'created_at': '2024-05-01T10:00:02.000Z',
      };
      final asstMsg = ChatMessageModel.fromJson(asstJson);
      expect(asstMsg.isUser, false);
      expect(asstMsg.isAssistant, true);
      expect(asstMsg.grounded, true);
    });
  });

  group('AskService Validation & Execution', () {
    late MockApiClient mockApi;
    late AskService askService;

    setUp(() {
      mockApi = MockApiClient();
      askService = AskService(apiClient: mockApi);
    });

    test('throws ValidationError when question is empty', () async {
      expect(
        () => askService.askQuestion(question: '   '),
        throwsA(isA<ValidationError>()),
      );
    });

    test('throws ValidationError when question exceeds 1000 characters', () async {
      final longQuestion = 'a' * 1001;
      expect(
        () => askService.askQuestion(question: longQuestion),
        throwsA(isA<ValidationError>()),
      );
    });

    test('successfully sends question to /api/ask with exact payload', () async {
      mockApi.postResponse = {
        'answer': 'Your room rent is limited to Single Private AC Room.',
        'grounded': true,
        'confidence': 'high',
        'conversation_id': 'conv_test_99',
        'message_id': 'msg_test_99',
        'citations': [
          {'chunk_id': 'c1', 'page_number': 3, 'section_title': 'Room Rent'}
        ],
        'sources': [],
      };

      final response = await askService.askQuestion(
        question: 'What is the room rent limit?',
        policyId: 'pol_101',
        conversationId: 'conv_prior',
      );

      expect(mockApi.lastEndpoint, '/api/ask');
      expect(mockApi.lastBody?['question'], 'What is the room rent limit?');
      expect(mockApi.lastBody?['policy_id'], 'pol_101');
      expect(mockApi.lastBody?['conversation_id'], 'conv_prior');

      expect(response.answer, contains('Single Private AC Room'));
      expect(response.grounded, true);
      expect(response.conversationId, 'conv_test_99');
      expect(response.citations.length, 1);
    });

    test('omits policy_id when policyId is "all" or empty', () async {
      mockApi.postResponse = {
        'answer': 'Grounded answer across all policies.',
        'grounded': true,
        'confidence': 'high',
        'conversation_id': 'conv_all',
        'message_id': 'msg_all',
        'citations': [],
        'sources': [],
      };

      await askService.askQuestion(
        question: 'What is my total coverage?',
        policyId: 'all',
      );

      expect(mockApi.lastEndpoint, '/api/ask');
      expect(mockApi.lastBody?.containsKey('policy_id'), false);
    });

    test('propagates ServerError on 500 or invalid format', () async {
      mockApi.postError = const ServerError('Backend RAG service unavailable.');

      expect(
        () => askService.askQuestion(question: 'Does this cover cataract?'),
        throwsA(isA<ServerError>()),
      );
    });
  });
}
