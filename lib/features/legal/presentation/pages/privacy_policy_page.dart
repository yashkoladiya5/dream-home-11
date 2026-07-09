import 'package:flutter/material.dart';

class PrivacyPolicyPage extends StatelessWidget {
  const PrivacyPolicyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy Policy')),
      body: const SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Privacy Policy',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            Text(
              'Last updated: July 2026',
              style: TextStyle(fontStyle: FontStyle.italic),
            ),
            SizedBox(height: 24),
            _Section(
              title: 'Information We Collect',
              content: 'We collect information you provide directly, including your name, phone number, email address, and KYC documents (Aadhaar, PAN). We also collect usage data, device information, and cookies for analytics.',
            ),
            _Section(
              title: 'How We Use Your Information',
              content: 'We use your information to operate our platform, process contests and rewards, verify your identity, comply with legal obligations, and improve our services.',
            ),
            _Section(
              title: 'Data Sharing',
              content: 'We do not sell your personal information. We may share data with service providers, legal authorities when required, and contest partners with your consent.',
            ),
            _Section(
              title: 'Data Retention',
              content: 'We retain your data for as long as your account is active and for 90 days after deletion. KYC documents are retained per regulatory requirements.',
            ),
            _Section(
              title: 'Your Rights',
              content: 'You have the right to access, correct, delete, or export your data. Use the GDPR options in your account settings to exercise these rights.',
            ),
            _Section(
              title: 'Contact',
              content: 'For privacy concerns, contact our Data Protection Officer at privacy@dreamhome11.com.',
            ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final String content;

  const _Section({required this.title, required this.content});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(content, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
}
