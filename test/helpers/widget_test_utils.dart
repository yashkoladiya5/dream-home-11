import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

extension WidgetTesterUtils on WidgetTester {
  Future<void> pumpWidgetWithApp(Widget widget) async {
    await pumpWidget(MaterialApp(home: widget));
  }
}
