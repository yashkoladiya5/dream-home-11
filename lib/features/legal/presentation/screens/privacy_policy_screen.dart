import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class PrivacySection {
  final String title;
  final String content;
  const PrivacySection({required this.title, required this.content});
}

const List<PrivacySection> privacyData = [
  PrivacySection(
    title: '1. Information We Collect',
    content: 'We collect information you provide during registration including your name, phone number, email address, and date of birth. We also collect KYC documents (Aadhaar, PAN), payment information, device information, usage data, and location data to provide and improve our services.',
  ),
  PrivacySection(
    title: '2. How We Use Your Information',
    content: 'Your information is used to create and manage your account, process transactions, verify your identity, provide customer support, send notifications, improve the Platform, comply with legal obligations, and detect and prevent fraudulent activity.',
  ),
  PrivacySection(
    title: '3. Information Sharing',
    content: 'We do not sell your personal information to third parties. We may share your information with: payment processors for transaction processing, KYC verification partners, legal authorities when required by law, and service providers who assist in Platform operations under strict confidentiality agreements.',
  ),
  PrivacySection(
    title: '4. Data Security',
    content: 'We implement industry-standard security measures including encryption, secure servers, and access controls to protect your data. However, no method of transmission over the internet is 100% secure. We encourage you to use strong passwords and enable available security features.',
  ),
  PrivacySection(
    title: '5. Data Retention',
    content: 'We retain your personal information for as long as your account is active and for a reasonable period thereafter to comply with legal obligations, resolve disputes, and enforce our agreements. KYC documents are retained in accordance with regulatory requirements.',
  ),
  PrivacySection(
    title: '6. Your Rights',
    content: 'You have the right to access, correct, or delete your personal data. You can update your profile information from the Edit Profile section. For data deletion requests, please contact support. We will respond to your request within 30 days.',
  ),
  PrivacySection(
    title: '7. Cookies and Tracking',
    content: 'We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and serve relevant content. You can control cookie preferences through your browser settings. Disabling cookies may affect certain Platform features.',
  ),
  PrivacySection(
    title: '8. Third-Party Services',
    content: 'The Platform may contain links to third-party websites or services. We are not responsible for their privacy practices. We encourage you to review their privacy policies. Our payment processing partners have their own data handling practices.',
  ),
  PrivacySection(
    title: '9. Children\'s Privacy',
    content: 'The Platform is not intended for users under 18 years of age. We do not knowingly collect information from minors. If we become aware that a minor has provided us with personal data, we will take steps to delete it and close the account.',
  ),
  PrivacySection(
    title: '10. International Data Transfers',
    content: 'Your data may be processed on servers located in India and other jurisdictions where our service providers operate. By using the Platform, you consent to the transfer of your data to these locations, which may have different data protection laws.',
  ),
  PrivacySection(
    title: '11. Updates to Privacy Policy',
    content: 'We may update this Privacy Policy periodically. Material changes will be notified through the Platform or via email. We encourage you to review this policy regularly. Continued use after changes constitutes acceptance of the updated policy.',
  ),
  PrivacySection(
    title: '12. Contact Information',
    content: 'If you have questions, concerns, or requests regarding this Privacy Policy, please contact our Data Protection Officer through the Support page or email us at privacy@dreamhome11.com. We will address your concerns promptly.',
  ),
  PrivacySection(
    title: '13. Grievance Officer',
    content: 'In accordance with applicable laws, we have appointed a Grievance Officer to address your concerns. You may contact the Grievance Officer at grievance@dreamhome11.com. Complaints will be acknowledged within 24 hours and resolved within 30 days.',
  ),
];

class PrivacyPolicyScreen extends StatefulWidget {
  const PrivacyPolicyScreen({super.key});
  @override
  State<PrivacyPolicyScreen> createState() => _PrivacyPolicyScreenState();
}

class _PrivacyPolicyScreenState extends State<PrivacyPolicyScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy Policy'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: privacyData.length,
        itemBuilder: (context, index) {
          final section = privacyData[index];
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
