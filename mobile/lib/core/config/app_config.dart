import 'package:flutter/foundation.dart';

class AppConfig {
  static const String appName = 'PRISM';
  static const String appTagline = 'Your Health Policy Companion';

  // Supabase Configuration (Strictly public client credentials)
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://jyfxxudarzedrebnrykt.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'sb_publishable_g9Qdf3nXknlgS_LqK9EQTA_tItn-dmQ',
  );

  // FastAPI Backend Configuration
  // 1. Explicit override via --dart-define=API_BASE_URL=... takes priority
  // 2. In release mode (kReleaseMode), connects to deployed production Railway backend
  // 3. In debug/local mode, defaults to Android emulator loopback http://10.0.2.2:8000
  static const String _envApiBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    if (_envApiBaseUrl.isNotEmpty) {
      return _envApiBaseUrl;
    }
    if (kReleaseMode) {
      return 'https://prism-backend-production.up.railway.app';
    }
    return 'http://10.0.2.2:8000';
  }
}
