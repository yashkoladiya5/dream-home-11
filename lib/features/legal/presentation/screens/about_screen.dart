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
    content: 'Dream Home 11 is India\'s premier gamified loyalty platform that combines the thrill of contests with the dream of winning real homes. We provide a secure, transparent, and entertaining environment where users can compete, earn points, and win amazing prizes including fully furnished dream homes.',
    icon: Icons.home_rounded,
  ),
  AboutSection(
    title: 'Our Mission',
    content: 'To revolutionize the loyalty rewards experience by creating a gamified ecosystem where every interaction adds value. We are committed to providing a fair, transparent, and exciting platform that rewards skill, consistency, and community participation.',
    icon: Icons.rocket_launch_rounded,
  ),
  AboutSection(
    title: 'Our Vision',
    content: 'To become the most loved loyalty and rewards platform in India, known for innovation, integrity, and life-changing rewards. We envision a community where millions of users engage, compete, and achieve their dreams together.',
    icon: Icons.visibility_rounded,
  ),
  AboutSection(
    title: 'Key Features',
    content: 'Dream Home 11 offers: Multiple contest formats (Mega, Normal, Home, Private), Real-time scoring and leaderboards, Daily points-earning activities, Spin wheel rewards, Community feed and chat, KYC-verified withdrawals, Prize homes as rewards, Referral bonuses, and 24/7 customer support.',
    icon: Icons.star_rounded,
  ),
  AboutSection(
    title: 'Security & Trust',
    content: 'We prioritize the security and trust of our users. The platform employs industry-standard encryption, secure payment processing, and strict KYC verification. All contests are conducted transparently with clear rules and fair play policies enforced by automated systems.',
    icon: Icons.shield_rounded,
  ),
  AboutSection(
    title: 'Fair Play Commitment',
    content: 'Dream Home 11 is committed to fair play. We use automated systems to detect and prevent fraud, collusion, and abuse. Our algorithms ensure that all participants have an equal opportunity to succeed based on their skill and engagement.',
    icon: Icons.scale_rounded,
  ),
  AboutSection(
    title: 'Regulatory Compliance',
    content: 'Dream Home 11 operates in full compliance with applicable Indian laws and regulations. We adhere to data protection laws, gaming regulations, and financial compliance requirements. Users from restricted states (Assam, Odisha, Telangana) cannot participate in withdrawal activities.',
    icon: Icons.gavel_rounded,
  ),
  AboutSection(
    title: 'Continuous Improvement',
    content: 'We are constantly working to improve the platform based on user feedback and technological advancements. New features, contests, and rewards are added regularly. We welcome your suggestions and feedback through the Support page.',
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
