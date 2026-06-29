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
    content: 'We collect information you provide directly when you register, including your full name, phone number, email address, date of birth, and created username. When you complete KYC verification, we collect government-issued identification documents such as Aadhaar, PAN card, and a selfie photograph. Payment-related information including bank account details, UPI IDs, and transaction history is collected when you deposit or withdraw funds. We also automatically collect device information (IP address, device model, operating system, unique device identifiers), usage data (pages visited, features used, time spent), and approximate location data to provide and improve our services.',
  ),
  PrivacySection(
    title: '2. How We Use Your Information',
    content: 'We use your information to create and maintain your account, authenticate your identity, process deposits and withdrawals, and calculate points and rewards. Your data enables us to personalize your experience by suggesting relevant contests and offers, send important service notifications including transaction alerts and policy updates, provide customer support and resolve technical issues, analyze usage patterns to improve Platform functionality and user experience, detect and prevent fraudulent or unauthorized activity, and comply with applicable legal and regulatory obligations including reporting to government authorities when required.',
  ),
  PrivacySection(
    title: '3. Information Sharing',
    content: 'We do not sell, rent, or trade your personal information to third parties for their marketing purposes. We may share your information with payment gateway partners and banks to process financial transactions, KYC verification agencies to authenticate your identity documents, cloud service providers who host our data on secure servers with contractual data protection obligations, legal and regulatory authorities when disclosure is required by applicable law or legal process, and professional advisors including auditors and legal counsel. All third parties we engage are bound by strict confidentiality agreements and are permitted to use your data only for the specific purposes we authorize.',
  ),
  PrivacySection(
    title: '4. Data Security',
    content: 'We implement comprehensive security measures to protect your data, including end-to-end encryption of sensitive information during transmission, secure socket layer (SSL) technology, encrypted storage of passwords and financial data using industry-standard hashing algorithms, role-based access controls restricting internal access to authorized personnel only, regular security audits and vulnerability assessments, and firewalls and intrusion detection systems. Despite these measures, no method of electronic storage or transmission is 100% secure. We encourage you to use strong, unique passwords and enable two-factor authentication where available. You are responsible for maintaining the confidentiality of your account credentials.',
  ),
  PrivacySection(
    title: '5. Data Retention',
    content: 'We retain your personal information for as long as your account remains active and for a period of 36 months thereafter to comply with legal obligations, resolve potential disputes, prevent fraud, and enforce our Terms of Service. KYC documents are retained in accordance with regulatory requirements and applicable data retention laws, typically for a period of 5 years from account closure. Anonymized and aggregated data may be retained indefinitely for analytical purposes. Upon expiration of the retention period, your personal data will be securely deleted or anonymized. You may request earlier deletion of your data as outlined in Your Rights below.',
  ),
  PrivacySection(
    title: '6. Your Rights',
    content: 'You have the right to access the personal data we hold about you and request a copy in a structured, commonly used format. You may request correction of inaccurate or incomplete information by updating your profile in the Edit Profile section or by contacting support. You have the right to request deletion of your personal data subject to our legal retention obligations. You may withdraw consent for processing where consent is the legal basis, though this may affect our ability to provide certain services. You may object to processing of your data for direct marketing purposes. To exercise any of these rights, please contact us through the Support page or email privacy@dreamhome11.com. We will respond to all legitimate requests within 30 days as required by applicable law.',
  ),
  PrivacySection(
    title: '7. Cookies and Tracking',
    content: 'We use cookies, web beacons, and similar tracking technologies to enhance your experience on the Platform. Essential cookies are necessary for basic Platform functionality including authentication and session management. Analytics cookies help us understand how you use the Platform so we can improve features and performance. Preference cookies remember your settings and language choices. Advertising cookies may be used to deliver relevant promotional content. You can control and manage cookie preferences through your browser settings at any time. Please note that disabling certain cookies may affect the availability or functionality of some Platform features. We also use third-party analytics services that may set their own cookies subject to their respective privacy policies.',
  ),
  PrivacySection(
    title: '8. Third-Party Services',
    content: 'The Platform may integrate with or contain links to third-party services, websites, and applications including payment processors, analytics providers, and social media platforms. We are not responsible for the privacy practices, data collection policies, or content of these third parties. We encourage you to review the privacy policies and terms of service of any third-party services you access through the Platform. Our payment processing partners (including but not limited to Razorpay, PayU, and BillDesk) have their own data handling practices and privacy policies. We do not control and assume no liability for how these third parties collect, use, or disclose your information.',
  ),
  PrivacySection(
    title: '9. Children\'s Privacy',
    content: 'The Platform is strictly intended for users who are 18 years of age or older. We do not knowingly solicit, collect, or process personal information from minors. If you are a parent or guardian and believe that a minor has provided us with personal data without your consent, please contact us immediately at privacy@dreamhome11.com. Upon verification, we will take prompt steps to delete all such information and close the associated account. We encourage parents and guardians to monitor their children\'s online activity and educate them about privacy and safe internet practices.',
  ),
  PrivacySection(
    title: '10. International Data Transfers',
    content: 'Your personal data may be transferred to, stored, and processed in servers located in India and other jurisdictions where we, our affiliates, or our service providers operate facilities. These jurisdictions may have data protection laws that differ from those in your country of residence. By using the Platform and providing your information, you consent to the transfer of your data to locations outside your country of residence. We take appropriate safeguards, including standard contractual clauses and data processing agreements, to ensure that your data receives an adequate level of protection wherever it is processed. If you have questions about international data transfers, please contact our Data Protection Officer.',
  ),
  PrivacySection(
    title: '11. Updates to Privacy Policy',
    content: 'We reserve the right to update, modify, or amend this Privacy Policy at any time to reflect changes in our practices, legal requirements, or operational needs. Material changes will be communicated to you through prominent notice on the Platform, email notification, or in-app alert at least 7 days before the changes take effect. We encourage you to review this Privacy Policy periodically for any updates. Your continued use of the Platform after the effective date of any changes constitutes your acceptance of the updated Privacy Policy. If you do not agree with the changes, you may close your account and cease using the Platform.',
  ),
  PrivacySection(
    title: '12. Contact Information',
    content: 'If you have any questions, concerns, complaints, or requests regarding this Privacy Policy or our data handling practices, please contact our Data Protection Officer through the Support page within the Platform, or by email at privacy@dreamhome11.com. You may also write to us at: Dream Home 11, Registered Office, India. We are committed to addressing your inquiries and resolving any concerns promptly. We will acknowledge receipt of your communication within 48 hours and respond substantively within 30 days. If you are not satisfied with our response, you have the right to lodge a complaint with the relevant data protection authority.',
  ),
  PrivacySection(
    title: '13. Grievance Officer',
    content: 'In accordance with Rule 5(9) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and applicable data protection laws, we have appointed a Grievance Officer to address your concerns regarding data privacy and Platform usage. You may contact the Grievance Officer at grievance@dreamhome11.com or through the Support page. The Grievance Officer will acknowledge receipt of your complaint within 24 hours and endeavor to resolve it within 30 days from the date of receipt. Please provide your full name, registered email address, and a detailed description of your concern to facilitate prompt resolution.',
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
