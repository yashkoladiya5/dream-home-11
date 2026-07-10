import 'package:flutter/material.dart';

class TermsOfServicePage extends StatelessWidget {
  const TermsOfServicePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Terms of Service')),
      body: const SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Terms of Service',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 16),
            Text(
              'Last updated: July 2026',
              style: TextStyle(fontStyle: FontStyle.italic),
            ),
            SizedBox(height: 24),
            _Section(
              title: 'Eligibility',
              content: 'You must be 18 years or older to use this platform. You must provide accurate information during registration and KYC verification.',
            ),
            _Section(
              title: 'Account Responsibility',
              content: 'You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use.',
            ),
            _Section(
              title: 'Contest Rules',
              content: 'All contest entries are subject to the specific rules of each contest. We reserve the right to cancel or modify contests with appropriate notice.',
            ),
            _Section(
              title: 'Payments & Withdrawals',
              content: 'Withdrawals are subject to KYC verification. Minimum withdrawal amounts and processing times are specified in the app. Cash prizes are non-transferable.',
            ),
            _Section(
              title: 'Prohibited Activities',
              content: 'You may not use automated tools, create multiple accounts, engage in fraudulent activity, or manipulate contest outcomes.',
            ),
            _Section(
              title: 'Limitation of Liability',
              content: 'We are not liable for indirect damages, loss of profits, or service interruptions beyond our reasonable control.',
            ),
            _Section(
              title: 'Termination',
              content: 'We may suspend or terminate accounts for violations of these terms. You may delete your account at any time via the GDPR deletion option.',
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
