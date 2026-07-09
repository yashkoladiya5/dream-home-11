import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CookieConsentBanner extends StatefulWidget {
  final Widget child;

  const CookieConsentBanner({super.key, required this.child});

  @override
  State<CookieConsentBanner> createState() => _CookieConsentBannerState();
}

class _CookieConsentBannerState extends State<CookieConsentBanner> {
  bool _showBanner = false;

  @override
  void initState() {
    super.initState();
    _checkConsent();
  }

  Future<void> _checkConsent() async {
    final prefs = await SharedPreferences.getInstance();
    final consented = prefs.getBool('cookie_consent') ?? false;
    if (!mounted) return;
    setState(() => _showBanner = !consented);
  }

  Future<void> _accept() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('cookie_consent', true);
    if (!mounted) return;
    setState(() => _showBanner = false);
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        if (_showBanner)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Material(
              elevation: 8,
              child: Container(
                padding: const EdgeInsets.all(16),
                color: Theme.of(context).colorScheme.surface,
                child: SafeArea(
                  top: false,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'We use cookies',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'We use cookies and similar technologies to improve your experience, analyze traffic, and personalize content.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton(
                            onPressed: () {
                              // Navigate to privacy policy
                            },
                            child: const Text('Privacy Policy'),
                          ),
                          const SizedBox(width: 8),
                          FilledButton(
                            onPressed: _accept,
                            child: const Text('Accept All'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
