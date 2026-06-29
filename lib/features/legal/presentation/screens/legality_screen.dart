import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class LegalSection {
  final String title;
  final String content;
  const LegalSection({required this.title, required this.content});
}

const List<LegalSection> legalityData = [
  LegalSection(
    title: '1. Legal Status',
    content: 'Dream Home 11 is a skill-based gaming platform. Under Indian law, games of skill are excluded from the definition of gambling and are legally permissible. The Platform operates in compliance with applicable state and central laws. Users participate in contests that require skill, knowledge, and judgment rather than chance.',
  ),
  LegalSection(
    title: '2. State Restrictions',
    content: 'Residents of Assam, Odisha, and Telangana are not permitted to participate in paid contests on Dream Home 11 due to state-specific regulations that prohibit online gaming involving real money. We strictly enforce these restrictions and may request additional proof of residence. Users found violating these restrictions may have their accounts suspended and winnings forfeited.',
  ),
  LegalSection(
    title: '3. Game of Skill vs. Chance',
    content: 'The Platform\'s contests are designed as games of skill where user performance depends on cricket knowledge, analytical ability, and strategic decision-making. The outcome is determined primarily by the participant\'s skill in selecting players and predicting match events. This classification is supported by judicial precedents including the Supreme Court of India\'s ruling that games of skill are exempt from gambling prohibitions.',
  ),
  LegalSection(
    title: '4. Age Requirement',
    content: 'All users must be 18 years of age or older to register and participate in paid contests. Age verification is conducted during KYC. Any user found to be under 18 will have their account immediately suspended. Winnings from underage participation are forfeited and non-refundable deposits may be retained as per policy.',
  ),
  LegalSection(
    title: '5. KYC Compliance',
    content: 'Know Your Customer (KYC) verification is mandatory for all users before any withdrawal of winnings. Users must provide valid government-issued identification (Aadhaar, PAN card, Voter ID, or Passport) and a recent photograph. KYC details are verified through authorized third-party agencies compliant with applicable data protection laws.',
  ),
  LegalSection(
    title: '6. Tax Compliance',
    content: 'All winnings on Dream Home 11 are subject to applicable tax laws. Tax Deducted at Source (TDS) is applicable as per Section 194BA of the Income Tax Act, 1961 on net winnings exceeding specified thresholds. Users are responsible for reporting their winnings in their income tax returns. The Platform provides a consolidated tax statement annually.',
  ),
  LegalSection(
    title: '7. Fair Play Policy',
    content: 'Dream Home 11 is committed to maintaining the integrity of its contests. Any form of cheating, collusion, multiple account creation, use of automated tools, or exploitation of system vulnerabilities is strictly prohibited. We employ advanced monitoring systems to detect and prevent fraudulent activity. Violators will face account suspension, forfeiture of winnings, and potential legal action.',
  ),
  LegalSection(
    title: '8. Anti-Money Laundering',
    content: 'The Platform complies with anti-money laundering (AML) regulations and guidelines issued by relevant authorities. We monitor transactions for suspicious activity patterns and report any suspicious transactions to the Financial Intelligence Unit (FIU) as required by law. We reserve the right to request additional documentation for high-value transactions.',
  ),
  LegalSection(
    title: '9. Grievance Redressal',
    content: 'In compliance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, Dream Home 11 has appointed a Grievance Officer. Users may submit complaints regarding content, privacy, or Platform usage through the Support page. The Grievance Officer acknowledges receipt within 24 hours and resolves complaints within 30 days.',
  ),
  LegalSection(
    title: '10. Dispute Resolution',
    content: 'Any disputes arising from the use of the Platform shall be resolved through arbitration in accordance with the Arbitration and Conciliation Act, 1996. The arbitration shall be conducted in English in Mumbai, Maharashtra. Users agree to resolve disputes on an individual basis and waive any right to class action proceedings.',
  ),
  LegalSection(
    title: '11. Governing Law',
    content: 'These terms and the relationship between users and Dream Home 11 shall be governed by and construed in accordance with the laws of India. The courts of Mumbai, Maharashtra shall have exclusive jurisdiction over any matters arising from these terms, subject to the arbitration clause above.',
  ),
  LegalSection(
    title: '12. Modifications to Legal Framework',
    content: 'Dream Home 11 reserves the right to modify its legal and compliance framework in response to changes in applicable laws, regulatory guidelines, or judicial interpretations. Users will be notified of material changes through the Platform or registered contact details. Continued use after changes constitutes acceptance of the modified framework.',
  ),
];

class LegalityScreen extends StatefulWidget {
  const LegalityScreen({super.key});
  @override
  State<LegalityScreen> createState() => _LegalityScreenState();
}

class _LegalityScreenState extends State<LegalityScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Legality'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: legalityData.length,
        itemBuilder: (context, index) {
          final section = legalityData[index];
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
