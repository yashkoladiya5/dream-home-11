import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App shell has semantics', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('Test', semanticsLabel: 'App title')),
        body: const Column(
          children: [
            ListTile(
              leading: Icon(Icons.home, semanticLabel: 'Home'),
              title: Text('Home'),
            ),
            ListTile(
              leading: Icon(Icons.search, semanticLabel: 'Search'),
              title: Text('Search'),
            ),
          ],
        ),
      ),
    ));
    expect(tester.binding, isNotNull);
    expect(find.widgetWithText(ListTile, 'Home'), findsOneWidget);
  });
}
