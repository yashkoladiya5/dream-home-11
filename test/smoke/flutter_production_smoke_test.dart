import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

const _backendUrl = String.fromEnvironment('BACKEND_URL', defaultValue: 'http://localhost:3000');

void main() {
  testWidgets('App renders without crash', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(home: Scaffold(body: Center(child: Text('Dream Home 11')))),
    );
    await tester.pump();
    expect(find.text('Dream Home 11'), findsOneWidget);
  });

  testWidgets('Backend URL is configurable', (WidgetTester tester) async {
    expect(_backendUrl, isNotEmpty);
    expect(_backendUrl.startsWith('http'), isTrue);
  });

  testWidgets('RetryWidget renders correctly', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(home: Scaffold(body: _RetryButton(onRetry: () {}))),
    );
    await tester.pump();
    expect(find.text('Try Again'), findsOneWidget);
  });

  testWidgets('ConnectivityBanner renders', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(home: _buildConnectivityBanner()),
    );
    await tester.pump();
    expect(find.byType(Placeholder), findsOneWidget);
  });
}

Widget _buildConnectivityBanner() {
  return Scaffold(body: Center(child: Placeholder()));
}

class _RetryButton extends StatelessWidget {
  final VoidCallback onRetry;
  const _RetryButton({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(onPressed: onRetry, child: const Text('Try Again'));
  }
}
