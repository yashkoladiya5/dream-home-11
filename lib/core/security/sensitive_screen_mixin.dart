import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

mixin SensitiveScreenMixin<T extends StatefulWidget> on State<T> implements WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.inactive) {
      // When app goes to background, we could show a blur overlay
      // The native side will handle screenshot blocking
    }
  }

  void enableScreenshotProtection() {
    const MethodChannel('com.dreamhome11/security')
        .invokeMethod('enableScreenshotProtection');
  }

  void disableScreenshotProtection() {
    const MethodChannel('com.dreamhome11/security')
        .invokeMethod('disableScreenshotProtection');
  }
}
