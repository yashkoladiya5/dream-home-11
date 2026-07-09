import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:dream_home_11/core/theme/app_theme.dart';

void main() {
  group('AppTheme constants', () {
    test('primaryRed is correct color', () {
      expect(AppTheme.primaryRed, const Color(0xFFD22C2C));
    });

    test('darkSlate is correct color', () {
      expect(AppTheme.darkSlate, const Color(0xFF121826));
    });

    test('emeraldGreen is correct color', () {
      expect(AppTheme.emeraldGreen, const Color(0xFF10B981));
    });

    test('goldYellow is correct color', () {
      expect(AppTheme.goldYellow, const Color(0xFFF59E0B));
    });

    test('white is Colors.white', () {
      expect(AppTheme.white, Colors.white);
    });

    test('primaryGradient uses red colors', () {
      final gradient = AppTheme.primaryGradient;
      expect(gradient.colors[0], AppTheme.primaryRed);
      expect(gradient.colors.length, 2);
    });

    test('darkCardGradient uses slate colors', () {
      final gradient = AppTheme.darkCardGradient;
      expect(gradient.colors.length, 2);
    });

    test('goldGradient uses gold colors', () {
      final gradient = AppTheme.goldGradient;
      expect(gradient.colors[0], AppTheme.goldYellow);
    });
  });
}
