import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/features/settings/controllers/theme_controller.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ThemeController Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('initializes with system theme by default', () {
      final controller = ThemeController.testable();
      expect(controller.themeMode, ThemeMode.system);
      expect(controller.isInitialized, isFalse);
    });

    test('setThemeMode updates state and notifies listeners', () async {
      final controller = ThemeController.testable();
      int notifyCount = 0;
      controller.addListener(() {
        notifyCount++;
      });

      await controller.setThemeMode(ThemeMode.dark);
      expect(controller.themeMode, ThemeMode.dark);
      expect(notifyCount, 1);

      await controller.setThemeMode(ThemeMode.light);
      expect(controller.themeMode, ThemeMode.light);
      expect(notifyCount, 2);

      // Setting to same mode should not notify again
      await controller.setThemeMode(ThemeMode.light);
      expect(notifyCount, 2);
    });

    test('loadThemeMode restores saved dark theme from SharedPreferences',
        () async {
      SharedPreferences.setMockInitialValues({'prism_theme_mode': 'dark'});

      final controller = ThemeController.testable();
      await controller.loadThemeMode();

      expect(controller.themeMode, ThemeMode.dark);
      expect(controller.isInitialized, isTrue);
    });

    test('loadThemeMode restores saved light theme from SharedPreferences',
        () async {
      SharedPreferences.setMockInitialValues({'prism_theme_mode': 'light'});

      final controller = ThemeController.testable();
      await controller.loadThemeMode();

      expect(controller.themeMode, ThemeMode.light);
      expect(controller.isInitialized, isTrue);
    });
  });
}
