import 'package:flutter/material.dart';

class SensitiveScreenWrapper extends StatefulWidget {
  final Widget child;

  const SensitiveScreenWrapper({super.key, required this.child});

  @override
  State<SensitiveScreenWrapper> createState() => _SensitiveScreenWrapperState();
}

class _SensitiveScreenWrapperState extends State<SensitiveScreenWrapper> with WidgetsBindingObserver {
  bool _isBackgrounded = false;

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
    setState(() {
      _isBackgrounded = state == AppLifecycleState.inactive || state == AppLifecycleState.paused;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isBackgrounded) {
      return Stack(
        children: [
          widget.child,
          Container(
            color: const Color(0xFF121826),
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shield_outlined, color: Colors.white54, size: 48),
                  SizedBox(height: 16),
                  Text(
                    'Dream Home 11',
                    style: TextStyle(color: Colors.white54, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }
    return widget.child;
  }
}
