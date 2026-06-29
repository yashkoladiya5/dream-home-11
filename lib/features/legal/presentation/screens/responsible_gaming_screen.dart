import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class GamingSection {
  final String title;
  final String content;
  final IconData icon;
  const GamingSection({required this.title, required this.content, required this.icon});
}

const List<GamingSection> gamingData = [
  GamingSection(
    title: 'Our Commitment',
    content: 'Dream Home 11 is committed to promoting responsible gaming. We believe that gaming should be a fun and entertaining activity, not a source of financial or emotional distress. We provide tools and resources to help you maintain control over your gaming activities.',
    icon: Icons.handshake_rounded,
  ),
  GamingSection(
    title: 'Set Your Limits',
    content: 'We encourage you to set personal limits on your time and spending. Decide in advance how much time you will spend on the Platform and how much money you are willing to deposit. Never chase losses or gamble with money you cannot afford to lose.',
    icon: Icons.tune_rounded,
  ),
  GamingSection(
    title: 'Recognize the Signs',
    content: 'Warning signs of problematic gaming include: spending more money than intended, neglecting work or family obligations, lying about gaming activity, feeling anxious or irritable when not gaming, trying to recover losses by increasing play, and borrowing money to game.',
    icon: Icons.warning_amber_rounded,
  ),
  GamingSection(
    title: 'Self-Assessment',
    content: 'Ask yourself these questions: Do you spend more time or money on gaming than you planned? Have you tried to cut back without success? Does gaming interfere with your relationships or responsibilities? Do you game to escape problems? Answering yes may indicate a problem.',
    icon: Icons.self_improvement_rounded,
  ),
  GamingSection(
    title: 'Taking a Break',
    content: 'You can take a break from the Platform at any time. Use the self-exclusion feature in your account settings to temporarily disable your account. During the self-exclusion period, you will not be able to access your account or participate in any activities.',
    icon: Icons.pause_circle_rounded,
  ),
  GamingSection(
    title: 'Permanent Closure',
    content: 'If you feel that gaming is negatively impacting your life, you may request permanent closure of your account. Contact our support team to initiate the process. Remaining wallet balance will be refunded after verification and applicable deductions.',
    icon: Icons.cancel_rounded,
  ),
  GamingSection(
    title: 'Age Restriction',
    content: 'Dream Home 11 is strictly for users aged 18 and above. We verify age during KYC and may request additional documentation. Anyone found to be under 18 will have their account immediately suspended and any winnings forfeited.',
    icon: Icons.auto_fix_high_rounded,
  ),
  GamingSection(
    title: 'Family Controls',
    content: 'We recommend that parents and guardians monitor the online activities of young adults in their care. Use device-level parental controls to restrict access to gaming platforms. Keep your login credentials secure to prevent unauthorized use.',
    icon: Icons.family_restroom_rounded,
  ),
  GamingSection(
    title: 'Financial Advice',
    content: 'If you are concerned about your financial situation due to gaming, we recommend consulting a financial advisor. Never use credit cards or loans to fund gaming activities. Treat gaming as entertainment with a fixed budget, not as a way to make money.',
    icon: Icons.account_balance_rounded,
  ),
  GamingSection(
    title: 'Support Resources',
    content: 'If you or someone you know needs help with gaming-related issues, contact these resources: National Helpline (1800-XXX-XXXX), Gambling Therapy (www.gamblingtherapy.org), or local counseling services. Professional help is available and effective.',
    icon: Icons.support_rounded,
  ),
  GamingSection(
    title: 'Platform Features',
    content: 'Dream Home 11 provides features to support responsible gaming: deposit limits, session time reminders, activity history, spending reports, and easy access to account settings. Use these tools to manage your gaming experience responsibly.',
    icon: Icons.settings_rounded,
  ),
  GamingSection(
    title: 'Reality Check',
    content: 'Remember that gaming on Dream Home 11 is a form of entertainment, not a source of income. The odds of winning depend on skill and participation. There is no guaranteed way to win. Enjoy the experience and play responsibly.',
    icon: Icons.update_rounded,
  ),
];

class ResponsibleGamingScreen extends StatefulWidget {
  const ResponsibleGamingScreen({super.key});
  @override
  State<ResponsibleGamingScreen> createState() => _ResponsibleGamingScreenState();
}

class _ResponsibleGamingScreenState extends State<ResponsibleGamingScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Responsible Gaming'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: gamingData.length,
        itemBuilder: (context, index) {
          final section = gamingData[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _buildGamingCard(context, section),
          );
        },
      ),
    );
  }

  Widget _buildGamingCard(BuildContext context, GamingSection section) {
    final iconColor = AppTheme.emeraldGreen;
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: ExpansionTile(
        leading: Icon(section.icon, color: iconColor, size: 20),
        title: Text(
          section.title,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: AppTheme.emeraldGreen,
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
    );
  }
}
