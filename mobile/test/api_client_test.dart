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

    test('400 response throws ValidationError with server message', () async {
      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode({'detail': 'Question cannot be empty.'}), 400);
      });

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'http://test-server.com',
      );

      expect(
        () => apiClient.post('/api/ask', body: {'question': ''}),
        throwsA(isA<ValidationError>().having((e) => e.message, 'message', 'Question cannot be empty.')),
      );
    });

    test('401 response throws AuthError with server message', () async {
      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode({'detail': 'Token expired'}), 401);
      });

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'http://test-server.com',
      );

      expect(
        () => apiClient.get('/api/policies'),
        throwsA(isA<AuthError>().having((e) => e.message, 'message', 'Token expired')),
      );
    });

    test('403 response throws AuthError with access denied message', () async {
      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode({'detail': 'Access denied to policy.'}), 403);
      });

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'http://test-server.com',
      );

      expect(
        () => apiClient.get('/api/policies/pol_other'),
        throwsA(isA<AuthError>().having((e) => e.message, 'message', 'Access denied to policy.')),
      );
    });

    test('404 response with Application not found throws ServerError for unavailable backend', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({
            'status': 'error',
            'code': 404,
            'message': 'Application not found',
            'request_id': 'test-req-123',
          }),
          404,
        );
      });

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'https://prism-backend-production.up.railway.app',
      );

      expect(
        () => apiClient.post('/api/ask', body: {'question': 'Test'}),
        throwsA(isA<ServerError>().having(
          (e) => e.message,
          'message',
          contains('PRISM AI service is temporarily unavailable'),
        )),
      );
    });

    test('404 response for standard resource throws NotFoundError', () async {
      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode({'detail': 'Policy not found'}), 404);
      });

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'http://test-server.com',
      );

      expect(
        () => apiClient.get('/api/policies/invalid_id'),
        throwsA(isA<NotFoundError>().having((e) => e.message, 'message', 'Policy not found')),
      );
    });

    test('422 response with FastAPI error list parses into ValidationError', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({
            'detail': [
              {'loc': ['body', 'question'], 'msg': 'Field required', 'type': 'missing'}
            ]
          }),
          422,
        );
      });

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'http://test-server.com',
      );

      expect(
        () => apiClient.post('/api/ask', body: {}),
        throwsA(isA<ValidationError>().having((e) => e.message, 'message', contains('Field required'))),
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

    test('503 response throws ServerError with service unavailable message', () async {
      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode({'detail': 'AI generation service is temporarily unavailable.'}), 503);
      });

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'http://test-server.com',
      );

      expect(
        () => apiClient.post('/api/ask', body: {'question': 'Test'}),
        throwsA(isA<ServerError>().having((e) => e.message, 'message', contains('AI generation service is temporarily unavailable.'))),
      );
    });

    test('http.ClientException throws NetworkError', () async {
      final mockClient = MockClient((request) async {
        throw http.ClientException('Failed to connect to host');
      });

      final apiClient = ApiClient(
        client: mockClient,
        baseUrl: 'http://test-server.com',
      );

      expect(
        () => apiClient.post('/api/ask', body: {'question': 'Test'}),
        throwsA(isA<NetworkError>()),
      );
    });
  });
}
