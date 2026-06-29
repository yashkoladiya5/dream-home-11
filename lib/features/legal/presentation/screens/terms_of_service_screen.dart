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
    content: 'By accessing, registering on, or using Dream Home 11 ("the Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. These terms constitute a legally binding agreement between you ("User") and the operator of Dream Home 11. If you do not agree with any part of these terms, you must immediately discontinue use of the Platform. We reserve the right to update or modify these terms at any time, and your continued use of the Platform following any changes constitutes acceptance of the revised terms.',
  ),
  TermsSection(
    title: '2. Eligibility',
    content: 'You must be at least 18 years of age to register and use the Platform. By creating an account, you represent and warrant that you are not a resident of Assam, Odisha, or Telangana, as these states are restricted due to local laws and regulations governing online gaming and contests. You further represent that you are not located in any other jurisdiction where participation in the Platform\'s contests would be prohibited by applicable law. You must provide accurate, current, and complete information during the registration process and are obligated to maintain and promptly update your account details to ensure their accuracy. The Platform reserves the right to verify your eligibility at any stage and to suspend or terminate accounts found to be in violation of these eligibility requirements.',
  ),
  TermsSection(
    title: '3. Account Registration',
    content: 'Each natural person may register and maintain only one account on the Platform. Accounts are personal and non-transferable. You are solely responsible for maintaining the confidentiality and security of your login credentials, including your password and any OTP-based authentication. Any and all activities that occur under your account, whether authorized by you or not, are your responsibility. You agree to notify us immediately in writing of any unauthorized use of your account or any other breach of security. We are not liable for any loss or damage arising from your failure to safeguard your account credentials. We reserve the right to refuse registration, suspend, or terminate accounts at our sole discretion, including but not limited to cases of suspected duplicate accounts, fraudulent activity, or violation of these terms.',
  ),
  TermsSection(
    title: '4. Points and Wallet',
    content: 'Points earned on the Platform are virtual reward units that have no real-world value unless and until they are redeemed through approved channels as designated by the Platform from time to time. Wallet balances represent real currency held in your account and are maintained separately from points. Points and wallet balances are non-transferable between users, whether by gift, sale, or any other method. We reserve the right to deduct, adjust, reverse, or forfeit points or wallet balances in cases of suspected fraud, error, abuse, violation of terms, or technical glitches. Points may be subject to expiration as communicated through the Platform. Wallet balances may only be withdrawn in accordance with the withdrawal policy and after successful completion of KYC verification.',
  ),
  TermsSection(
    title: '5. Contests and Participation',
    content: 'Participation in contests is voluntary and subject to the specific rules, entry fees, scoring criteria, eligibility requirements, and prize structures displayed at the time of entry for each contest. By joining a contest, you agree to abide by its specific rules in addition to these general terms. Winners are determined based solely on the stated scoring and judging criteria, and the decisions of the Platform regarding contest results are final and binding. The Platform reserves the right to cancel, suspend, modify, or reschedule any contest at any time with reasonable notice communicated through the Platform or via email. In the event of cancellation, entry fees may be refunded at the Platform\'s discretion. The Platform does not guarantee that any particular contest will be available for any specific duration.',
  ),
  TermsSection(
    title: '6. Prizes and Withdrawals',
    content: 'All prizes, including cash winnings, gift cards, merchandise, and dream homes, are subject to verification and approval before disbursement. Withdrawals of wallet balances are processed only after successful completion of KYC verification and are subject to minimum and maximum amount limits as specified on the Platform from time to time. Prize homes are awarded in accordance with the specific contest rules and may be subject to additional documentation and legal formalities. All taxes, duties, and levies applicable on winnings and prizes are the sole responsibility of the winner, and the Platform may deduct applicable tax at source as required by law. Processing times for withdrawals and prize delivery may vary and are not guaranteed. Fraudulent or erroneous prize claims will result in forfeiture and account action.',
  ),
  TermsSection(
    title: '7. KYC and Identity Verification',
    content: 'You agree to provide valid government-issued identification documents, including but not limited to Aadhaar card, PAN card, passport, or driving license, for the purpose of KYC verification. We may use third-party services to verify the authenticity of your documents and identity information. KYC verification is mandatory for withdrawing cash winnings, claiming prize homes, and accessing certain Platform features. Failure to complete KYC within the stipulated time may result in restrictions on your account including the inability to withdraw funds or participate in certain contests. You represent and warrant that all documents and information provided for KYC are genuine, accurate, and not tampered with. We reserve the right to reject KYC submissions that appear suspicious or fail verification checks.',
  ),
  TermsSection(
    title: '8. Prohibited Activities',
    content: 'You expressly agree not to engage in any of the following activities: creating or operating multiple accounts; using automated tools, bots, scripts, or any form of automation to interact with the Platform; engaging in collusion, match-fixing, or any form of fraud with other users; exploiting bugs, glitches, or system vulnerabilities for personal gain; posting or transmitting offensive, abusive, defamatory, or obscene content; violating any applicable local, state, national, or international laws; attempting to breach, compromise, or interfere with the security, integrity, or performance of the Platform; reverse-engineering, decompiling, or disassembling the Platform or its components; using the Platform for money laundering or any illegal financial activity; or encouraging or assisting others in any of the above prohibited activities. Violation of these prohibitions will result in immediate account suspension or termination, forfeiture of balances, and possible legal action.',
  ),
  TermsSection(
    title: '9. Fees and Charges',
    content: 'Contest entry fees are non-refundable except in cases where a contest is canceled by the Platform or as explicitly stated in the specific contest rules. Payment processing fees, gateway charges, and convenience fees may apply to deposits and withdrawals, and these fees will be clearly displayed before you complete any transaction. The Platform reserves the right to modify its fee structure at any time with reasonable notice communicated through the Platform. You are responsible for any bank charges, network fees, or other third-party charges incurred in connection with your use of the Platform. All fees are displayed in Indian Rupees (INR) unless otherwise specified. Disputed fees should be reported within 30 days of the transaction.',
  ),
  TermsSection(
    title: '10. Intellectual Property',
    content: 'The Platform, including but not limited to its software, design, layout, graphics, logos, trademarks, text, content, technology, algorithms, and underlying code, is the exclusive intellectual property of Dream Home 11 or its licensors and is protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Platform for its intended personal purposes. You may not copy, reproduce, modify, distribute, publicly display, perform, publish, create derivative works from, or exploit any part of the Platform without our prior written consent. User-generated content, including comments, profile information, and contest entries, remains your property; however, by submitting content, you grant us a worldwide, royalty-free, perpetual, irrevocable license to use, reproduce, modify, and display such content in connection with the operation and promotion of the Platform.',
  ),
  TermsSection(
    title: '11. Privacy',
    content: 'Your privacy is important to us. Our Privacy Policy, which is incorporated into these terms by reference, explains how we collect, use, store, process, share, and protect your personal data in compliance with applicable data protection laws. By using the Platform, you consent to our data collection and processing practices as described in the Privacy Policy. We implement reasonable technical and organizational measures to safeguard your personal information. We do not sell your personal data to third parties. We may share your information with trusted service providers, regulatory authorities, and law enforcement agencies as required by law or as necessary to operate the Platform. You have the right to access, correct, or request deletion of your personal data in accordance with applicable law.',
  ),
  TermsSection(
    title: '12. Limitation of Liability',
    content: 'To the maximum extent permitted by applicable law, Dream Home 11, its affiliates, directors, employees, agents, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, arising from or relating to your use of or inability to use the Platform. Our total aggregate liability to you for any claims arising under these terms, whether in contract, tort, or otherwise, is limited to the total amount you have deposited into your wallet on the Platform in the six months preceding the event giving rise to the claim. The Platform is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not guarantee uninterrupted, timely, secure, or error-free operation of the Platform.',
  ),
  TermsSection(
    title: '13. Termination',
    content: 'We reserve the right to suspend, restrict, or terminate your account at any time, with or without cause, including but not limited to violation of these terms, fraudulent activity, violation of applicable law, or at your request. You may terminate your account at any time by contacting support. Upon termination for violation of terms, any remaining wallet balance may be forfeited at our discretion, and unused points will be forfeited. Upon voluntary termination or termination without cause, you may request withdrawal of your remaining verified wallet balance, subject to completion of KYC and applicable withdrawal limits. Termination does not relieve you of obligations incurred prior to termination, including payment of fees or penalties. Certain provisions of these terms, including those relating to intellectual property, limitation of liability, and dispute resolution, shall survive termination.',
  ),
  TermsSection(
    title: '14. Dispute Resolution',
    content: 'Any disputes, claims, or controversies arising out of or relating to these Terms of Service or your use of the Platform shall first be attempted to be resolved through informal negotiation. If the dispute cannot be resolved within 30 days of notification, it shall be referred to and finally resolved by binding arbitration in accordance with the Arbitration and Conciliation Act, 1996 of India. The arbitration shall be conducted in English by a sole arbitrator appointed by mutual agreement, and the venue of arbitration shall be Mumbai, India. You agree to resolve disputes on an individual basis and hereby waive any right to participate in a class action or multi-party proceeding against the Platform. Notwithstanding the foregoing, we may seek injunctive or other equitable relief in any court of competent jurisdiction to protect our intellectual property or confidential information.',
  ),
  TermsSection(
    title: '15. Modifications',
    content: 'We reserve the right to modify, update, or replace these Terms of Service at any time and from time to time at our sole discretion. Material changes will be notified to you through the Platform, via email, or through an in-app notification at least 7 days prior to the effective date. Your continued use of the Platform after the effective date of any modifications constitutes your acceptance of and agreement to the modified terms. If you do not agree to the modified terms, you must stop using the Platform and may terminate your account. We encourage you to review these terms periodically to stay informed of any changes. The date of the most recent revision will be indicated at the top of this page.',
  ),
  TermsSection(
    title: '16. Contact',
    content: 'For questions, concerns, or requests regarding these Terms of Service, please contact us through the Support page available on the Platform, or send an email to support@dreamhome11.com. You may also write to us at our registered address as displayed on the Platform. We aim to acknowledge all inquiries within 48 business hours and to resolve them as promptly as possible. When contacting us, please provide your registered account details and a clear description of your query to help us assist you efficiently.',
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
