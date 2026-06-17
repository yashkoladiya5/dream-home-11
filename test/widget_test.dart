import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dream_home_11/main.dart';

void main() {
  testWidgets('App splash screen smoke test', (WidgetTester tester) async {
    // Build our app under ProviderScope and trigger a frame.
    await tester.pumpWidget(
      const ProviderScope(
        child: MyApp(),
      ),
    );

    // Verify that the splash screen title is present.
    expect(find.text('DREAM HOME 11'), findsOneWidget);
    expect(find.text('Play. Earn points. Win your home.'), findsOneWidget);

    // Pump the timer (2.5s) to allow the splash timer to complete and avoid pending timers error.
    await tester.pump(const Duration(seconds: 3));
  });
}
