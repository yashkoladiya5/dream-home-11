import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:dream_home_11/core/widgets/offline_placeholder.dart';

void main() {
  group('OfflinePlaceholder', () {
    testWidgets('displays default offline message', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: OfflinePlaceholder()),
        ),
      );

      expect(find.text('No Connection'), findsOneWidget);
      expect(
        find.text('Unable to load data. Please check your internet connection.'),
        findsOneWidget,
      );
    });

    testWidgets('displays cloud off icon by default', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: OfflinePlaceholder()),
        ),
      );

      expect(find.byIcon(Icons.cloud_off_rounded), findsOneWidget);
    });

    testWidgets('displays custom title and message', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: OfflinePlaceholder(
              title: 'Custom Title',
              message: 'Custom message body.',
              icon: Icons.error_outline,
            ),
          ),
        ),
      );

      expect(find.text('Custom Title'), findsOneWidget);
      expect(find.text('Custom message body.'), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('shows retry button when onRetry is provided', (tester) async {
      bool retried = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OfflinePlaceholder(
              onRetry: () => retried = true,
            ),
          ),
        ),
      );

      expect(find.text('Retry'), findsOneWidget);

      await tester.tap(find.text('Retry'));
      expect(retried, isTrue);
    });

    testWidgets('does not show retry button when onRetry is null', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: OfflinePlaceholder()),
        ),
      );

      expect(find.text('Retry'), findsNothing);
    });
  });
}
