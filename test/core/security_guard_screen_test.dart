import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:dream_home_11/core/security/security_guard_screen.dart';

void main() {
  group('SecurityGuardScreen', () {
    testWidgets('displays device compromised message', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: SecurityGuardScreen(),
        ),
      );

      expect(find.text('Device Compromised'), findsOneWidget);
      expect(
        find.text(
          'This app cannot run on a rooted or jailbroken device for security reasons.',
        ),
        findsOneWidget,
      );
      expect(find.text('Exit App'), findsOneWidget);
    });

    testWidgets('displays root indicators when provided', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: const SecurityGuardScreen(
            indicators: ['su_binary_found', 'test_keys_build'],
          ),
        ),
      );

      expect(find.text('su_binary_found'), findsOneWidget);
      expect(find.text('test_keys_build'), findsOneWidget);
    });

    testWidgets('shows shield icon', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: SecurityGuardScreen(),
        ),
      );

      expect(find.byIcon(Icons.shield_outlined), findsOneWidget);
    });

    testWidgets('Exit App button is tappable', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: SecurityGuardScreen(),
        ),
      );

      final exitButton = find.text('Exit App');
      expect(exitButton, findsOneWidget);
    });
  });
}
