import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class GuidelineItem {
  final String category;
  final String title;
  final String description;
  final IconData icon;
  const GuidelineItem({
    required this.category,
    required this.title,
    required this.description,
    required this.icon,
  });
}

const List<GuidelineItem> guidelineData = [
  GuidelineItem(
    category: 'Respect & Conduct',
    title: 'Be Respectful',
    description: 'Treat all community members with respect and courtesy. Harassment, hate speech, discrimination, bullying, or any form of abusive behavior will not be tolerated. We are a diverse community and everyone deserves to feel welcome.',
    icon: Icons.favorite_rounded,
  ),
  GuidelineItem(
    category: 'Respect & Conduct',
    title: 'No Toxic Behavior',
    description: 'Avoid excessive negativity, trolling, or intentionally provoking other users. Constructive feedback is welcome, but personal attacks, name-calling, and toxic behavior are strictly prohibited.',
    icon: Icons.sentiment_satisfied_rounded,
  ),
  GuidelineItem(
    category: 'Respect & Conduct',
    title: 'Keep It Clean',
    description: 'Do not post or share content that is obscene, vulgar, sexually explicit, or otherwise offensive. This includes profile pictures, usernames, posts, comments, and chat messages.',
    icon: Icons.cleaning_services_rounded,
  ),
  GuidelineItem(
    category: 'Fair Play',
    title: 'One Account Per Person',
    description: 'Each user is allowed only one account. Creating multiple accounts, sharing accounts, or using someone else\'s account is a violation of our terms and may result in permanent suspension.',
    icon: Icons.person_rounded,
  ),
  GuidelineItem(
    category: 'Fair Play',
    title: 'No Collusion',
    description: 'Do not collude with other players to manipulate contest outcomes, unfairly distribute winnings, or exploit the system. Fair competition is the foundation of Dream Home 11.',
    icon: Icons.groups_rounded,
  ),
  GuidelineItem(
    category: 'Fair Play',
    title: 'No Automated Tools',
    description: 'Using bots, scripts, macros, or any automated tools to interact with the platform is strictly forbidden. All activity must be performed manually by the account holder.',
    icon: Icons.smart_toy_rounded,
  ),
  GuidelineItem(
    category: 'Fair Play',
    title: 'Accurate Information',
    description: 'Provide accurate and truthful information during registration, KYC, and all interactions. False or misleading information may result in account suspension and forfeiture of winnings.',
    icon: Icons.fact_check_rounded,
  ),
  GuidelineItem(
    category: 'Prohibited Actions',
    title: 'No Fraudulent Activity',
    description: 'Any attempt to defraud the platform, other users, or payment processors is strictly prohibited. This includes chargeback fraud, fake documents, payment manipulation, and identity theft.',
    icon: Icons.gavel_rounded,
  ),
  GuidelineItem(
    category: 'Prohibited Actions',
    title: 'No Spam or Self-Promotion',
    description: 'Do not spam the feed, comments, or chat with promotional content, advertisements, or unrelated links. Self-promotion of external services, websites, or products is not allowed.',
    icon: Icons.report_rounded,
  ),
  GuidelineItem(
    category: 'Prohibited Actions',
    title: 'No Exploiting Bugs',
    description: 'If you discover a bug, glitch, or vulnerability, report it to support immediately. Exploiting system weaknesses for personal gain is a violation and may lead to account suspension and recovery of gains.',
    icon: Icons.bug_report_rounded,
  ),
  GuidelineItem(
    category: 'Prohibited Actions',
    title: 'No Cheating or Hacking',
    description: 'Attempting to hack, modify, or tamper with the app, its data, or its security measures is strictly forbidden. Any such activity will result in immediate and permanent account ban.',
    icon: Icons.security_rounded,
  ),
  GuidelineItem(
    category: 'Content Guidelines',
    title: 'Original Content Only',
    description: 'Post only content that you have created or have permission to share. Do not post copyrighted material, intellectual property, or personal information of others without consent.',
    icon: Icons.copyright_rounded,
  ),
  GuidelineItem(
    category: 'Content Guidelines',
    title: 'No Misinformation',
    description: 'Do not spread false information, rumors, or misleading content about the platform, contests, prizes, or other users. Verify facts before posting and report misinformation when you see it.',
    icon: Icons.verified_rounded,
  ),
  GuidelineItem(
    category: 'Content Guidelines',
    title: 'Relevant Content',
    description: 'Keep your posts and comments relevant to Dream Home 11 and the community. Off-topic content, including unrelated memes, news, and advertising, may be removed.',
    icon: Icons.topic_rounded,
  ),
  GuidelineItem(
    category: 'Account Security',
    title: 'Protect Your Account',
    description: 'Keep your login credentials secure. Do not share your password, OTP, or device with anyone. Dream Home 11 will never ask for your password or OTP outside of the login process.',
    icon: Icons.lock_rounded,
  ),
  GuidelineItem(
    category: 'Account Security',
    title: 'Report Suspicious Activity',
    description: 'If you notice unauthorized access to your account or suspicious activity, change your password immediately and contact support. Enable notifications to stay informed about account activity.',
    icon: Icons.report_problem_rounded,
  ),
  GuidelineItem(
    category: 'Account Security',
    title: 'Device Security',
    description: 'Use a secure device with updated software to access Dream Home 11. Avoid using public or shared devices for logging into your account. Log out after each session on shared devices.',
    icon: Icons.phonelink_lock_rounded,
  ),
  GuidelineItem(
    category: 'Reporting & Enforcement',
    title: 'How to Report Violations',
    description: 'Use the Support page to report any violations of these guidelines. Provide as much detail as possible, including screenshots if applicable. All reports are reviewed by our moderation team.',
    icon: Icons.flag_rounded,
  ),
  GuidelineItem(
    category: 'Reporting & Enforcement',
    title: 'Enforcement Actions',
    description: 'Violations of community guidelines may result in: warning, content removal, temporary suspension, permanent account ban, forfeiture of points and winnings, and legal action in severe cases.',
    icon: Icons.priority_high_rounded,
  ),
  GuidelineItem(
    category: 'Reporting & Enforcement',
    title: 'Appeal Process',
    description: 'If you believe an enforcement action was taken in error, you may appeal by contacting support. Appeals are reviewed within 5-7 business days. Submit all relevant evidence with your appeal.',
    icon: Icons.restart_alt_rounded,
  ),
  GuidelineItem(
    category: 'Additional Policies',
    title: 'Fair Play Policy',
    description: 'Our Fair Play Policy ensures that all users have an equal and enjoyable experience. We monitor for unusual activity patterns and reserve the right to investigate any suspicious behavior.',
    icon: Icons.scale_rounded,
  ),
  GuidelineItem(
    category: 'Additional Policies',
    title: 'Privacy & Data Protection',
    description: 'We take your privacy seriously. Your personal data is handled in accordance with our Privacy Policy. Do not share personal information of yourself or others in public areas of the platform.',
    icon: Icons.privacy_tip_rounded,
  ),
  GuidelineItem(
    category: 'Additional Policies',
    title: 'Updates to Guidelines',
    description: 'These guidelines may be updated from time to time. Users will be notified of significant changes. Continued use of the platform after updates constitutes acceptance of the revised guidelines.',
    icon: Icons.update_rounded,
  ),
];

class CommunityGuidelinesScreen extends StatefulWidget {
  const CommunityGuidelinesScreen({super.key});
  @override
  State<CommunityGuidelinesScreen> createState() => _CommunityGuidelinesScreenState();
}

class _CommunityGuidelinesScreenState extends State<CommunityGuidelinesScreen> {
  @override
  Widget build(BuildContext context) {
    final categories = guidelineData.map((e) => e.category).toSet().toList();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Community Guidelines'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          final items = guidelineData.where((e) => e.category == category).toList();
          return _buildCategorySection(context, category, items);
        },
      ),
    );
  }

  Widget _buildCategorySection(BuildContext context, String category, List<GuidelineItem> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 16, bottom: 12),
          child: Text(
            category,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
              color: AppTheme.primaryRed,
            ),
          ),
        ),
        ...items.map((item) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: ExpansionTile(
              leading: Icon(item.icon, color: AppTheme.emeraldGreen, size: 20),
              title: Text(
                item.title,
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
                  item.description,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.greyMedium,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        )),
      ],
    );
  }
}
