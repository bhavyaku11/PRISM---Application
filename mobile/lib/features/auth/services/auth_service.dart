import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/errors/app_error.dart';

class AuthService {
  final SupabaseClient _client;

  AuthService({SupabaseClient? client}) : _client = client ?? _getSafeClient();

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

  User? get currentUser => _client.auth.currentUser;
  Session? get currentSession => _client.auth.currentSession;
  bool get isAuthenticated => _client.auth.currentSession != null;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );
      return response;
    } on AuthException catch (e) {
      throw AuthError(e.message, e);
    } catch (e) {
      throw ServerError('Sign in failed. Please try again.', e);
    }
  }

  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String fullName,
  }) async {
    try {
      final response = await _client.auth.signUp(
        email: email.trim(),
        password: password,
        data: {
          'full_name': fullName.trim(),
        },
      );
      return response;
    } on AuthException catch (e) {
      throw AuthError(e.message, e);
    } catch (e) {
      throw ServerError('Sign up failed. Please try again.', e);
    }
  }

  Future<void> signOut() async {
    try {
      await _client.auth.signOut();
    } catch (e) {
      throw ServerError('Sign out failed.', e);
    }
  }
}
