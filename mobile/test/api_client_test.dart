import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:prism_mobile/core/errors/app_error.dart';
import 'package:prism_mobile/core/network/api_client.dart';

void main() {
  group('ApiClient', () {
    test('successful GET request returns decoded JSON', () async {
      final mockClient = MockClient((request) async {
        expect(request.url.path, '/health');
        expect(request.headers['Content-Type'], 'application/json');
        return http.Response(jsonEncode({'status': 'ok'}), 200);
      });

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'http://test-server.com',
      );

      final result = await apiClient.get('/health');
      expect(result, {'status': 'ok'});
    });

    test('401 response throws AuthError', () async {
      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode({'detail': 'Token expired'}), 401);
      });

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'http://test-server.com',
      );

      expect(
        () => apiClient.get('/api/policies'),
        throwsA(isA<AuthError>()),
      );
    });

    test('404 response throws NotFoundError', () async {
      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode({'detail': 'Policy not found'}), 404);
      });

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'http://test-server.com',
      );

      expect(
        () => apiClient.get('/api/policies/invalid_id'),
        throwsA(isA<NotFoundError>()),
      );
    });

    test('500 response throws ServerError', () async {
      final mockClient = MockClient((request) async {
        return http.Response('Internal error', 500);
      });

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'http://test-server.com',
      );

      expect(
        () => apiClient.get('/api/ask'),
        throwsA(isA<ServerError>()),
      );
    });
  });
}
