import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/app_config.dart';
import '../errors/app_error.dart';

class ApiClient {
  final http.Client _client;
  final String _baseUrl;
  final Duration _timeout;

  ApiClient({
    http.Client? client,
    String? baseUrl,
    Duration timeout = const Duration(seconds: 30),
  })  : _client = client ?? http.Client(),
        _baseUrl =
            (baseUrl ?? AppConfig.apiBaseUrl).replaceAll(RegExp(r'/+$'), ''),
        _timeout = timeout;

  Map<String, String> _buildHeaders([Map<String, String>? extraHeaders]) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      final session = Supabase.instance.client.auth.currentSession;
      if (session != null && session.accessToken.isNotEmpty) {
        headers['Authorization'] = 'Bearer ${session.accessToken}';
      }
    } catch (_) {
      // In testing or before initialization, Supabase.instance might not be ready
    }

    if (extraHeaders != null) {
      headers.addAll(extraHeaders);
    }
    return headers;
  }

  Future<dynamic> get(String path, {Map<String, String>? headers}) async {
    final cleanPath = path.startsWith('/') ? path : '/$path';
    final uri = Uri.parse('$_baseUrl$cleanPath');
    try {
      final response = await _client
          .get(uri, headers: _buildHeaders(headers))
          .timeout(_timeout);
      return _handleResponse(response);
    } on SocketException catch (e) {
      throw NetworkError(
          'Unable to connect to server. Check your connection.', e);
    } on http.ClientException catch (e) {
      throw NetworkError(
          'Unable to connect to server. Check your connection.', e);
    } on TimeoutException catch (e) {
      throw NetworkError('Request timed out. Please try again.', e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw ServerError('An unexpected network error occurred.', e);
    }
  }

  Future<dynamic> post(String path,
      {Map<String, dynamic>? body, Map<String, String>? headers}) async {
    final cleanPath = path.startsWith('/') ? path : '/$path';
    final uri = Uri.parse('$_baseUrl$cleanPath');
    try {
      final response = await _client
          .post(
            uri,
            headers: _buildHeaders(headers),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(_timeout);
      return _handleResponse(response);
    } on SocketException catch (e) {
      throw NetworkError(
          'Unable to connect to server. Check your connection.', e);
    } on http.ClientException catch (e) {
      throw NetworkError(
          'Unable to connect to server. Check your connection.', e);
    } on TimeoutException catch (e) {
      throw NetworkError('Request timed out. Please try again.', e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw ServerError('An unexpected network error occurred.', e);
    }
  }

  Future<dynamic> delete(String path, {Map<String, String>? headers}) async {
    final cleanPath = path.startsWith('/') ? path : '/$path';
    final uri = Uri.parse('$_baseUrl$cleanPath');
    try {
      final response = await _client
          .delete(uri, headers: _buildHeaders(headers))
          .timeout(_timeout);
      return _handleResponse(response);
    } on SocketException catch (e) {
      throw NetworkError(
          'Unable to connect to server. Check your connection.', e);
    } on http.ClientException catch (e) {
      throw NetworkError(
          'Unable to connect to server. Check your connection.', e);
    } on TimeoutException catch (e) {
      throw NetworkError('Request timed out. Please try again.', e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw ServerError('An unexpected network error occurred.', e);
    }
  }

  String? _extractErrorMessage(dynamic decoded) {
    if (decoded is Map) {
      // 1. Check 'detail' (FastAPI standard)
      final detail = decoded['detail'];
      if (detail is String && detail.trim().isNotEmpty) {
        return detail.trim();
      } else if (detail is List && detail.isNotEmpty) {
        final msgs = detail
            .map((item) => item is Map ? item['msg']?.toString() : item.toString())
            .where((msg) => msg != null && msg.isNotEmpty)
            .toList();
        if (msgs.isNotEmpty) return msgs.join(', ');
      }

      // 2. Check 'error'
      final error = decoded['error'];
      if (error is String && error.trim().isNotEmpty) {
        return error.trim();
      } else if (error is Map && error['message'] is String) {
        return (error['message'] as String).trim();
      }

      // 3. Check 'message' (Railway, PostgREST, etc.)
      final message = decoded['message'];
      if (message is String && message.trim().isNotEmpty) {
        return message.trim();
      }
    } else if (decoded is String && decoded.trim().isNotEmpty) {
      return decoded.trim();
    }
    return null;
  }

  dynamic _handleResponse(http.Response response) {
    dynamic decoded;
    try {
      if (response.body.isNotEmpty) {
        decoded = jsonDecode(response.body);
      }
    } catch (_) {
      decoded = null;
    }

    final rawMessage = _extractErrorMessage(decoded);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    } else if (response.statusCode == 400) {
      throw ValidationError(
          rawMessage ?? 'Invalid request data.');
    } else if (response.statusCode == 401) {
      throw AuthError(
          rawMessage ?? 'Your session has expired. Please sign in again.');
    } else if (response.statusCode == 403) {
      throw AuthError(
          rawMessage ?? 'Access denied. You do not have permission to access this resource.');
    } else if (response.statusCode == 404) {
      if (rawMessage != null &&
          (rawMessage.toLowerCase().contains('application not found') ||
           rawMessage.toLowerCase().contains('service not found'))) {
        throw ServerError(
            'PRISM AI service is temporarily unavailable. Please try again shortly. ($rawMessage)');
      }
      throw NotFoundError(rawMessage ?? 'Resource not found.');
    } else if (response.statusCode == 422) {
      throw ValidationError(rawMessage ?? 'Invalid request data.');
    } else if (response.statusCode == 502 ||
        response.statusCode == 503 ||
        response.statusCode == 504) {
      throw ServerError(rawMessage ??
          'PRISM service is temporarily unavailable (${response.statusCode}). Please try again shortly.');
    } else {
      throw ServerError(
          rawMessage ?? 'Server error occurred (${response.statusCode}).');
    }
  }

  void close() {
    _client.close();
  }
}
