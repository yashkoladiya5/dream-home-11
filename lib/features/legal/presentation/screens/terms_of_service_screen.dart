import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class TermsSection {
  final String title;
  final String content;
  const TermsSection({required this.title, required this.content});
}

const List<TermsSection> termsData = [
  TermsSection(
    title: '1. Acceptance of Terms',
    content: 'By creating an account and using Dream Home 11 ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use the Platform. These terms constitute a legally binding agreement between you and Dream Home 11.',
  ),
  TermsSection(
    title: '2. Eligibility',
    content: 'You must be at least 18 years old to use the Platform. You must not be a resident of Assam, Odisha, or Telangana, as these states are restricted due to local regulations. You must provide accurate and complete information during registration and keep your account details up to date.',
  ),
  TermsSection(
    title: '3. Account Registration',
    content: 'Each user may create only one account. You are responsible for maintaining the confidentiality of your login credentials. Any activity conducted through your account is your responsibility. You must notify us immediately of any unauthorized use of your account.',
  ),
  TermsSection(
    title: '4. Points and Wallet',
    content: 'Points earned on the Platform have no real-world value until redeemed through approved channels. Wallet balances represent real currency held in your account. Points and wallet balances are non-transferable between users. We reserve the right to adjust balances in case of errors or fraud.',
  ),
  TermsSection(
    title: '5. Contests and Participation',
    content: 'Contest rules are displayed at the time of entry. By joining a contest, you agree to its specific rules including entry fees, scoring criteria, and prize distribution. Winners are determined based on the stated rules. We reserve the right to cancel or modify contests with reasonable notice.',
  ),
  TermsSection(
    title: '6. Prizes and Withdrawals',
    content: 'All prizes are subject to verification. Withdrawals are processed after KYC verification and subject to minimum amount requirements. Prize homes are awarded as described in the specific contest rules. Taxes on winnings are the responsibility of the winner.',
  ),
  TermsSection(
    title: '7. KYC and Identity Verification',
    content: 'You agree to provide valid government-issued identification documents for KYC verification. We may use third-party services to verify your identity. Failure to complete KYC may restrict your ability to withdraw winnings or claim certain prizes.',
  ),
  TermsSection(
    title: '8. Prohibited Activities',
    content: 'You agree not to: create multiple accounts, use automated tools or bots, engage in collusion or fraud, exploit bugs or vulnerabilities, post offensive content, violate any applicable laws, or attempt to compromise the security of the Platform.',
  ),
  TermsSection(
    title: '9. Fees and Charges',
    content: 'Contest entry fees are non-refundable except as explicitly stated in contest rules. Payment processing fees may apply to deposits and withdrawals. We will clearly display any applicable fees before you complete a transaction.',
  ),
  TermsSection(
    title: '10. Intellectual Property',
    content: 'The Platform, including its design, logos, content, and technology, is owned by Dream Home 11 or its licensors. You may not copy, modify, distribute, or create derivative works without explicit permission. User-generated content remains your property, but you grant us a license to use it on the Platform.',
  ),
  TermsSection(
    title: '11. Privacy',
    content: 'Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal data. By using the Platform, you consent to our data practices as described in the Privacy Policy.',
  ),
  TermsSection(
    title: '12. Limitation of Liability',
    content: 'Dream Home 11 is not liable for any indirect, incidental, or consequential damages arising from your use of the Platform. Our total liability is limited to the amount you have deposited in your wallet. We do not guarantee uninterrupted or error-free operation.',
  ),
  TermsSection(
    title: '13. Termination',
    content: 'We may suspend or terminate your account at any time for violation of these terms or any applicable law. Upon termination, you may request withdrawal of your remaining wallet balance, subject to verification. Unused points may be forfeited.',
  ),
  TermsSection(
    title: '14. Dispute Resolution',
    content: 'Any disputes arising from these terms shall be resolved through binding arbitration in accordance with the laws of India. You agree to resolve disputes on an individual basis and waive any right to class action proceedings.',
  ),
  TermsSection(
    title: '15. Modifications',
    content: 'We reserve the right to modify these terms at any time. Material changes will be notified through the Platform or via email. Continued use after changes constitutes acceptance of the modified terms. We encourage you to review these terms periodically.',
  ),
  TermsSection(
    title: '16. Contact',
    content: 'For questions about these Terms of Service, please contact us through the Support page on the Platform or email us at support@dreamhome11.com. We aim to respond to all inquiries within 48 business hours.',
  ),
];

class TermsOfServiceScreen extends StatefulWidget {
  const TermsOfServiceScreen({super.key});
  @override
  State<TermsOfServiceScreen> createState() => _TermsOfServiceScreenState();
}

class _TermsOfServiceScreenState extends State<TermsOfServiceScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Terms of Service'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: termsData.length,
        itemBuilder: (context, index) {
          final section = termsData[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Container(
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                gradient: AppTheme.darkCardGradient,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0x1FFFFFFF)),
              ),
              child: ExpansionTile(
                title: Text(
                  section.title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                iconColor: AppTheme.primaryRed,
                collapsedIconColor: AppTheme.greyMedium,
                backgroundColor: Colors.transparent,
                collapsedBackgroundColor: Colors.transparent,
                children: [
                  Text(
                    section.content,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.greyMedium,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
