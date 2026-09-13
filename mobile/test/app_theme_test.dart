import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prism_mobile/app/theme.dart';

void main() {
  group('PrismTheme', () {
    test('theme has expected primary brand colors', () {
      expect(PrismTheme.navy, const Color(0xFF0B1220));
      expect(PrismTheme.deepBlue, const Color(0xFF162A46));
      expect(PrismTheme.primaryBlue, const Color(0xFF4F8CFF));
      expect(PrismTheme.softCyan, const Color(0xFF6ED7E8));
      expect(PrismTheme.backgroundLight, const Color(0xFFF6F8FB));
    });

    test('lightTheme has Material3 enabled and proper color scheme', () {
      final theme = PrismTheme.lightTheme;
      expect(theme.useMaterial3, true);
      expect(theme.colorScheme.primary, PrismTheme.primaryBlue);
      expect(theme.scaffoldBackgroundColor, PrismTheme.backgroundLight);
    });
  });
}
