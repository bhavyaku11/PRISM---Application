import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Manages application-wide theme mode (System, Light, Dark)
/// with instant UI updates and persistent storage.
class ThemeController extends ChangeNotifier {
  static final ThemeController _instance = ThemeController._internal();
  static ThemeController get instance => _instance;

  static const String _prefKey = 'prism_theme_mode';
  ThemeMode _themeMode = ThemeMode.system;
  bool _isInitialized = false;

  ThemeController._internal();

  /// Visible for testing to provide custom instances or reset state.
  @visibleForTesting
  ThemeController.testable();

  ThemeMode get themeMode => _themeMode;
  bool get isInitialized => _isInitialized;

  /// Loads the saved theme mode preference from SharedPreferences.
  Future<void> loadThemeMode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedMode = prefs.getString(_prefKey);
      if (savedMode != null) {
        switch (savedMode) {
          case 'light':
            _themeMode = ThemeMode.light;
            break;
          case 'dark':
            _themeMode = ThemeMode.dark;
            break;
          case 'system':
          default:
            _themeMode = ThemeMode.system;
            break;
        }
      }
    } catch (_) {
      // Fallback to system mode if preferences fail to load
      _themeMode = ThemeMode.system;
    } finally {
      _isInitialized = true;
      notifyListeners();
    }
  }

  /// Sets and persists a new theme mode, immediately notifying all listeners.
  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;

    _themeMode = mode;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      String modeStr;
      switch (mode) {
        case ThemeMode.light:
          modeStr = 'light';
          break;
        case ThemeMode.dark:
          modeStr = 'dark';
          break;
        case ThemeMode.system:
          modeStr = 'system';
          break;
      }
      await prefs.setString(_prefKey, modeStr);
    } catch (_) {
      // Storage error handled silently; runtime state was updated
    }
  }
}
