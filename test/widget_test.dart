import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dream_home_11/main.dart';
import 'package:dream_home_11/features/notifications/services/notification_handler.dart';

class _MockNotificationHandler implements NotificationHandler {
  @override
  Future<void> initialize() async {}

  @override
  void dispose() {}
}

Widget createTestApp() {
  return ProviderScope(
    overrides: [
      notificationHandlerProvider.overrideWith(
        (ref) => _MockNotificationHandler(),
      ),
    ],
    child: const DreamHomeApp(),
  );
}

void main() {
  testWidgets('App splash screen smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(createTestApp());
    await tester.pump();

    expect(find.text('DREAM HOME 11'), findsOneWidget);
    expect(find.text('Play. Earn points. Win your home.'), findsOneWidget);

    await tester.pump(const Duration(seconds: 3));
  });
}
