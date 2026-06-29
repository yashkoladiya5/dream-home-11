import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class AboutSection {
  final String title;
  final String content;
  final IconData icon;
  const AboutSection({required this.title, required this.content, required this.icon});
}

const List<AboutSection> aboutData = [
  AboutSection(
    title: 'About Dream Home 11',
    content: 'Dream Home 11 is India\'s premier gamified loyalty platform that combines the thrill of competitive contests with the dream of winning real homes. Founded with a vision to transform the loyalty rewards landscape, we provide a secure, transparent, and entertaining ecosystem where every interaction earns value. Users can participate in multiple contest formats, accumulate points through daily engagements, and win life-changing prizes including fully furnished dream homes, cash rewards, and exclusive merchandise. Our platform is designed to make every user feel like a winner, with rewards that go beyond the ordinary.',
    icon: Icons.home_rounded,
  ),
  AboutSection(
    title: 'Our Mission & Vision',
    content: 'Mission: To revolutionize the loyalty rewards experience by creating a gamified ecosystem where every interaction adds genuine value. We are committed to providing a fair, transparent, and exciting platform that rewards skill, consistency, and community participation. Vision: To become the most loved loyalty and rewards platform in India, recognized for our innovation, integrity, and life-changing rewards. We envision a vibrant community where millions of users engage, compete, and achieve their dreams together, fostering a culture of healthy competition and shared success.',
    icon: Icons.rocket_launch_rounded,
  ),
  AboutSection(
    title: 'Key Features of the Platform',
    content: 'Dream Home 11 offers a rich set of features designed for an engaging user experience. Multiple contest formats including Mega, Normal, Home, and Private contests cater to different play styles. Real-time scoring and dynamic leaderboards keep the competition alive. Daily points-earning activities, spin wheel rewards, and streak bonuses provide continuous engagement. The community feed and chat features enable social interaction among users. KYC-verified withdrawals, a comprehensive wallet system, and 24/7 customer support ensure a seamless and trustworthy experience. Referral bonuses and tier-based multipliers further enhance the earning potential for every user.',
    icon: Icons.star_rounded,
  ),
  AboutSection(
    title: 'Security & Trust',
    content: 'We prioritize the security and trust of our users above everything else. The platform employs industry-standard AES-256 encryption for data protection, secure payment gateways for all financial transactions, and strict KYC verification protocols to prevent fraud. All contests are conducted transparently with clearly published rules, real-time score updates, and automated result declarations. Our infrastructure is regularly audited by third-party security firms, and we maintain comprehensive data privacy practices in compliance with applicable laws. User funds are held in segregated accounts with complete audit trails.',
    icon: Icons.shield_rounded,
  ),
  AboutSection(
    title: 'Fair Play Commitment',
    content: 'Dream Home 11 is unwavering in its commitment to fair play. We employ sophisticated automated systems to detect and prevent fraud, collusion, multi-accounting, and any form of platform abuse. Our proprietary algorithms ensure that all participants have an equal and fair opportunity to succeed based on their skill, consistency, and genuine engagement. Real-time monitoring flags suspicious activity instantly, and our dedicated trust and safety team reviews all flagged cases. We maintain a zero-tolerance policy toward any violation of our fair play standards, ensuring a level playing field for every user.',
    icon: Icons.scale_rounded,
  ),
  AboutSection(
    title: 'Regulatory Compliance',
    content: 'Dream Home 11 operates in full compliance with applicable Indian laws and regulations governing online platforms, data protection, and financial transactions. We adhere strictly to the Information Technology Act, data privacy guidelines, and all relevant state-specific regulations. Users from restricted states including Assam, Odisha, and Telangana are currently restricted from participating in withdrawal activities due to local regulatory frameworks. We maintain transparent terms of service, privacy policies, and responsible gaming guidelines. Our legal team continuously monitors regulatory developments to ensure ongoing compliance.',
    icon: Icons.gavel_rounded,
  ),
  AboutSection(
    title: 'Continuous Improvement',
    content: 'We are constantly evolving the platform based on user feedback, technological advancements, and industry best practices. New features, contest formats, and reward categories are added regularly to keep the experience fresh and exciting. Our product and engineering teams follow agile development methodologies with regular update cycles. User suggestions submitted through the Support page directly influence our roadmap and feature prioritization. We are committed to delivering a world-class experience that grows and improves with our community, ensuring Dream Home 11 remains at the forefront of gamified loyalty platforms in India.',
    icon: Icons.trending_up_rounded,
  ),
];

class AboutScreen extends StatefulWidget {
  const AboutScreen({super.key});
  @override
  State<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends State<AboutScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('About'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: aboutData.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) {
            return _buildHeader(context);
          }
          final section = aboutData[index - 1];
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
                leading: Icon(section.icon, color: AppTheme.goldYellow, size: 20),
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

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryRed.withValues(alpha: 0.3),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: const Icon(Icons.home_rounded, color: Colors.white, size: 40),
          ),
          const SizedBox(height: 16),
          Text(
            'Dream Home 11',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Version 1.0.0',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppTheme.greyMedium,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your Dream Home Awaits',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.goldYellow,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }
}
