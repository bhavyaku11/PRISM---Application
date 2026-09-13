import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/auth/services/auth_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() {
  group('Session Handling & AuthService', () {
    late SupabaseClient dummyClient;
    late AuthService authService;

    setUp(() {
      dummyClient = SupabaseClient(
        'https://dummy.supabase.co',
        'dummy-key',
        authOptions: const AuthClientOptions(autoRefreshToken: false),
      );
      authService = AuthService(client: dummyClient);
    });

    test('fresh client has no active session or user', () {
      expect(authService.isAuthenticated, isFalse);
      expect(authService.currentUser, isNull);
      expect(authService.currentSession, isNull);
    });

    test('signOut on unauthenticated client completes cleanly', () async {
      await expectLater(authService.signOut(), completes);
    });
  });
}
