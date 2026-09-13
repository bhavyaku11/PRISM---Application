import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/errors/app_error.dart';
import '../../../core/network/api_client.dart';
import '../models/ask_models.dart';

class AskService {
  final ApiClient _apiClient;
  final SupabaseClient _supabaseClient;

  AskService({ApiClient? apiClient, SupabaseClient? supabaseClient})
      : _apiClient = apiClient ?? ApiClient(),
        _supabaseClient = supabaseClient ?? _getSafeClient();

  static SupabaseClient _getSafeClient() {
    try {
      return Supabase.instance.client;
    } catch (_) {
      return SupabaseClient(
        'https://dummy.supabase.co',
        'dummy-key',
        authOptions: const AuthClientOptions(autoRefreshToken: false),
      );
    }
  }

  /// Sends a policy question to the existing FastAPI backend Q&A RAG pipeline.
  Future<AskResponseModel> askQuestion({
    required String question,
    String? policyId,
    String? documentId,
    String? conversationId,
  }) async {
    final cleanQuestion = question.trim();
    if (cleanQuestion.isEmpty) {
      throw const ValidationError('Question cannot be empty.');
    }

    if (cleanQuestion.length > 1000) {
      throw const ValidationError('Question exceeds the 1000-character limit.');
    }

    final payload = <String, dynamic>{
      'question': cleanQuestion,
    };

    if (policyId != null && policyId.isNotEmpty && policyId != 'all') {
      payload['policy_id'] = policyId;
    }
    if (documentId != null && documentId.isNotEmpty) {
      payload['document_id'] = documentId;
    }
    if (conversationId != null && conversationId.isNotEmpty) {
      payload['conversation_id'] = conversationId;
    }

    try {
      final res = await _apiClient.post('/api/ask', body: payload);
      if (res is Map<String, dynamic>) {
        return AskResponseModel.fromJson(res);
      }
      throw const ServerError('Invalid response format from PRISM AI service.');
    } on AppError {
      rethrow;
    } catch (e) {
      throw NetworkError('Could not reach the policy intelligence service. Please check your connection.', e);
    }
  }

  /// Loads prior messages for an existing conversation thread from Supabase.
  Future<List<ChatMessageModel>> getConversationMessages(String conversationId) async {
    try {
      final user = _supabaseClient.auth.currentUser;
      if (user == null) {
        return const [];
      }

      final res = await _supabaseClient
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id)
          .order('created_at', ascending: true);

      return (res as List<dynamic>)
          .map((item) => ChatMessageModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return const [];
    }
  }

  /// Fetches recent conversation threads for the authenticated user.
  Future<List<Map<String, dynamic>>> getUserConversations({String? policyId}) async {
    try {
      final user = _supabaseClient.auth.currentUser;
      if (user == null) {
        return const [];
      }

      var query = _supabaseClient
          .from('conversations')
          .select('*')
          .eq('user_id', user.id);

      if (policyId != null && policyId.isNotEmpty && policyId != 'all') {
        query = query.eq('policy_id', policyId);
      }

      final res = await query.order('created_at', ascending: false).limit(20);
      return (res as List<dynamic>).map((e) => e as Map<String, dynamic>).toList();
    } catch (_) {
      return const [];
    }
  }
}
