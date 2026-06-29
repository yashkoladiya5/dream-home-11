import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class MoreSection {
  final String title;
  final String content;
  final IconData icon;
  const MoreSection({required this.title, required this.content, required this.icon});
}

const List<MoreSection> moreData = [
  MoreSection(
    title: 'Language Settings',
    content: 'Available languages: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati. You can change your preferred language from the Profile page under Language Settings.',
    icon: Icons.language_rounded,
  ),
  MoreSection(
    title: 'Notifications',
    content: 'Manage your push notification preferences. Control contest alerts, daily reminders, promotional offers, and community activity updates from the Notification Settings in your Profile.',
    icon: Icons.notifications_active_rounded,
  ),
  MoreSection(
    title: 'Data Usage',
    content: 'The app uses both Wi-Fi and mobile data. Image uploads are automatically compressed to reduce data consumption. Video content streams in optimized quality based on your connection speed.',
    icon: Icons.network_cell_rounded,
  ),
  MoreSection(
    title: 'Accessibility',
    content: 'The app supports text scaling, high contrast mode, screen reader compatibility, and font size adjustments. Enable these features through your device accessibility settings.',
    icon: Icons.accessibility_new_rounded,
  ),
  MoreSection(
    title: 'Storage Management',
    content: 'The app caches data locally for offline use. You can clear the cache from this screen to free up storage space. Total cache size is displayed below.',
    icon: Icons.storage_rounded,
  ),
  MoreSection(
    title: 'Permissions',
    content: 'App permissions required: Camera (KYC photo verification), Gallery (profile and feed image uploads), Notifications (contest and activity alerts), Storage (app cache).',
    icon: Icons.settings_rounded,
  ),
  MoreSection(
    title: 'Third-Party Licenses',
    content: 'This application uses open source software. Licenses are available for the Flutter framework, third-party packages, and custom fonts used within the app. View legal attributions.',
    icon: Icons.article_rounded,
  ),
  MoreSection(
    title: 'Rate the App',
    content: 'If you enjoy using Dream Home 11, please rate us on the Google Play Store or Apple App Store. Your feedback helps us improve and deliver a better experience.',
    icon: Icons.star_rate_rounded,
  ),
  MoreSection(
    title: 'Share the App',
    content: 'Share Dream Home 11 with your friends and family via messaging apps. Use your unique referral link to invite others and earn bonus points when they join.',
    icon: Icons.share_rounded,
  ),
  MoreSection(
    title: 'Version Information',
    content: 'Current version: 1.0.0. Latest update: June 2026. Check for updates on the Google Play Store or Apple App Store.',
    icon: Icons.info_rounded,
  ),
  MoreSection(
    title: 'Data & Privacy',
    content: 'Your privacy matters. View our Privacy Policy for details on data collection, usage, and storage. To request account deletion, contact support from the Help section.',
    icon: Icons.security_rounded,
  ),
  MoreSection(
    title: 'Help & Feedback',
    content: 'Send feedback via Support. Submit feature requests, report bugs, or make general inquiries. Our team typically responds within 24 hours.',
    icon: Icons.help_center_rounded,
  ),
];

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('More'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: moreData.length,
        itemBuilder: (context, index) {
          final section = moreData[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
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
}
