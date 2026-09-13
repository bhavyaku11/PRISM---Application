import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/errors/app_error.dart';
import '../models/policy_model.dart';
import '../models/policy_section_model.dart';

class PolicyService {
  final SupabaseClient _client;

  PolicyService({SupabaseClient? client})
      : _client = client ?? _getSafeClient();

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

  User? get _currentUser => _client.auth.currentUser;

  Future<List<PolicyModel>> getPolicies() async {
    final user = _currentUser;
    if (user == null) {
      throw const AuthError('You must be signed in to view policies.');
    }

    try {
      final res = await _client
          .from('policies')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      return (res as List<dynamic>)
          .map((item) => PolicyModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on PostgrestException catch (e) {
      throw ServerError(e.message, e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw NetworkError(
          'Unable to load policies. Please check your internet connection.', e);
    }
  }

  Future<PolicyModel?> getPolicyById(String id) async {
    final user = _currentUser;
    if (user == null) {
      throw const AuthError('You must be signed in to view policy details.');
    }

    try {
      final res = await _client
          .from('policies')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

      if (res == null) return null;
      return PolicyModel.fromJson(res);
    } on PostgrestException catch (e) {
      throw ServerError(e.message, e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw NetworkError(
          'Unable to load policy. Please check your internet connection.', e);
    }
  }

  Future<List<PolicySectionModel>> getPolicySections(String policyId) async {
    final user = _currentUser;
    if (user == null) {
      throw const AuthError('You must be signed in to view policy sections.');
    }

    try {
      final res = await _client
          .from('policy_sections')
          .select('*')
          .eq('policy_id', policyId)
          .eq('user_id', user.id)
          .order('page_start', ascending: true);

      return (res as List<dynamic>)
          .map((item) =>
              PolicySectionModel.fromJson(item as Map<String, dynamic>))
          .toList();
    } on PostgrestException catch (e) {
      throw ServerError(e.message, e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw NetworkError('Unable to load policy sections.', e);
    }
  }

  Future<Map<String, dynamic>?> getPolicyDocument(String policyId) async {
    final user = _currentUser;
    if (user == null) return null;

    try {
      final res = await _client
          .from('documents')
          .select('*')
          .eq('policy_id', policyId)
          .eq('user_id', user.id)
          .maybeSingle();

      return res;
    } catch (_) {
      return null;
    }
  }
}
