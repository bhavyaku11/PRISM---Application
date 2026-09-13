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
    final uri = Uri.parse('$_baseUrl$path');
    try {
      final response = await _client
          .get(uri, headers: _buildHeaders(headers))
          .timeout(_timeout);
      return _handleResponse(response);
    } on SocketException catch (e) {
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
    final uri = Uri.parse('$_baseUrl$path');
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
    } on TimeoutException catch (e) {
      throw NetworkError('Request timed out. Please try again.', e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw ServerError('An unexpected network error occurred.', e);
    }
  }

  Future<dynamic> delete(String path, {Map<String, String>? headers}) async {
    final uri = Uri.parse('$_baseUrl$path');
    try {
      final response = await _client
          .delete(uri, headers: _buildHeaders(headers))
          .timeout(_timeout);
      return _handleResponse(response);
    } on SocketException catch (e) {
      throw NetworkError(
          'Unable to connect to server. Check your connection.', e);
    } on TimeoutException catch (e) {
      throw NetworkError('Request timed out. Please try again.', e);
    } catch (e) {
      if (e is AppError) rethrow;
      throw ServerError('An unexpected network error occurred.', e);
    }
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

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    } else if (response.statusCode == 401) {
      throw AuthError('Your session has expired. Please sign in again.');
    } else if (response.statusCode == 403) {
      final message =
          decoded is Map ? decoded['detail'] ?? decoded['error'] : null;
      throw AuthError(
          message ?? 'Access denied. You do not have permission to access this resource.');
    } else if (response.statusCode == 404) {
      final message =
          decoded is Map ? decoded['detail'] ?? decoded['error'] : null;
      throw NotFoundError(message ?? 'Resource not found.');
    } else if (response.statusCode == 422) {
      final message =
          decoded is Map ? decoded['detail'] ?? decoded['error'] : null;
      throw ValidationError(message ?? 'Invalid request data.');
    } else {
      final message =
          decoded is Map ? decoded['detail'] ?? decoded['error'] : null;
      throw ServerError(
          message ?? 'Server error occurred (${response.statusCode}).');
    }
  }

  void close() {
    _client.close();
  }
}
