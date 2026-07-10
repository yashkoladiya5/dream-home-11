import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class TermsAcceptanceBanner extends StatefulWidget {
  final Widget child;
  final VoidCallback onAccept;

  const TermsAcceptanceBanner({
    super.key,
    required this.child,
    required this.onAccept,
  });

  @override
  State<TermsAcceptanceBanner> createState() => _TermsAcceptanceBannerState();
}

class _TermsAcceptanceBannerState extends State<TermsAcceptanceBanner> {
  bool _accepted = false;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _checkAcceptance();
  }

  Future<void> _checkAcceptance() async {
    final prefs = await SharedPreferences.getInstance();
    final accepted = prefs.getBool('terms_accepted') ?? false;
    if (!mounted) return;
    setState(() {
      _accepted = accepted;
      _loading = false;
    });
  }

  Future<void> _accept() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('terms_accepted', true);
    if (!mounted) return;
    setState(() => _accepted = true);
    widget.onAccept();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return widget.child;
    if (_accepted) return widget.child;

    return PopScope(
      canPop: false,
      child: Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.description_outlined, size: 64, color: Theme.of(context).colorScheme.primary),
                const SizedBox(height: 24),
                Text(
                  'Terms of Service',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Text(
                  'Please read and accept our Terms of Service and Privacy Policy to continue using Dream Home 11.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 32),
                Container(
                  height: 200,
                  decoration: BoxDecoration(
                    border: Border.all(color: Theme.of(context).dividerColor),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const SingleChildScrollView(
                    padding: EdgeInsets.all(12),
                    child: Text(
                      '1. Acceptance of Terms\n'
                      'By using Dream Home 11, you agree to these Terms of Service.\n\n'
                      '2. Eligibility\n'
                      'You must be 18 years or older to use this platform.\n\n'
                      '3. Account\n'
                      'You are responsible for your account security.\n\n'
                      '4. Contests\n'
                      'All contest entries are subject to specific contest rules.\n\n'
                      '5. Payments\n'
                      'Withdrawals require KYC verification.\n\n'
                      '6. Prohibited Activities\n'
                      'Fraudulent activities will result in account termination.\n\n'
                      '7. Limitation of Liability\n'
                      'We are not liable for indirect damages.\n\n'
                      '8. Termination\n'
                      'We may suspend accounts for violations.',
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _accept,
                  child: const Text('I Accept'),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () {
                    // Navigate to full ToS page
                  },
                  child: const Text('Read Full Terms'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
