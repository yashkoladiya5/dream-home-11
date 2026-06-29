import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class ContactMethod {
  final String title;
  final String detail;
  final IconData icon;
  final Color iconColor;
  final VoidCallback? onTap;
  const ContactMethod({
    required this.title,
    required this.detail,
    required this.icon,
    this.iconColor = AppTheme.goldYellow,
    this.onTap,
  });
}

const List<ContactMethod> contactMethods = [
  ContactMethod(
    title: 'Email Support',
    detail: 'support@dreamhome11.com',
    icon: Icons.email_rounded,
    iconColor: AppTheme.primaryRed,
  ),
  ContactMethod(
    title: 'Grievance Officer',
    detail: 'grievance@dreamhome11.com',
    icon: Icons.mail_outline_rounded,
    iconColor: AppTheme.goldYellow,
  ),
  ContactMethod(
    title: 'Privacy Concerns',
    detail: 'privacy@dreamhome11.com',
    icon: Icons.privacy_tip_rounded,
    iconColor: AppTheme.emeraldGreen,
  ),
  ContactMethod(
    title: 'Phone Support',
    detail: '+91 1800-XXX-XXXX (Toll Free)',
    icon: Icons.phone_rounded,
    iconColor: Colors.cyan,
  ),
  ContactMethod(
    title: 'WhatsApp',
    detail: '+91 XXXX-XXXXXX',
    icon: Icons.chat_rounded,
    iconColor: AppTheme.emeraldGreen,
  ),
  ContactMethod(
    title: 'Registered Office',
    detail: 'Dream Home 11 HQ, Bangalore, Karnataka, India - 560001',
    icon: Icons.location_on_rounded,
    iconColor: AppTheme.primaryRed,
  ),
  ContactMethod(
    title: 'Working Hours',
    detail: 'Monday - Saturday, 9:00 AM - 6:00 PM IST',
    icon: Icons.schedule_rounded,
    iconColor: AppTheme.goldYellow,
  ),
  ContactMethod(
    title: 'Support Ticket',
    detail: 'Submit via Profile > Support for faster resolution',
    icon: Icons.support_agent_rounded,
    iconColor: Colors.cyan,
  ),
];

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});
  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contact Us'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildHeader(context),
          const SizedBox(height: 24),
          Container(
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: Column(
              children: [
                for (int i = 0; i < contactMethods.length; i++) ...[
                  if (i > 0) const Divider(height: 1, color: Color(0x1FFFFFFF)),
                  _buildContactRow(context, contactMethods[i]),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),
          Container(
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Icon(Icons.access_time_rounded, color: AppTheme.goldYellow, size: 28),
                const SizedBox(height: 12),
                Text(
                  'Response Time',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'We aim to respond to all inquiries within 24-48 business hours. Urgent matters may be resolved faster through the Support ticket system.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.greyMedium,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Icon(Icons.headset_mic_rounded, color: Colors.white, size: 36),
        ),
        const SizedBox(height: 16),
        Text(
          'Get in Touch',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'We\'re here to help',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: AppTheme.greyMedium,
          ),
        ),
      ],
    );
  }

  Widget _buildContactRow(BuildContext context, ContactMethod method) {
    return InkWell(
      onTap: method.onTap,
      borderRadius: BorderRadius.zero,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: method.iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(method.icon, color: method.iconColor, size: 18),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    method.title,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    method.detail,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.greyMedium,
                    ),
                  ),
                ],
              ),
            ),
            if (method.title == 'Email Support' || method.title == 'Phone Support' || method.title == 'WhatsApp')
              const Icon(Icons.open_in_new_rounded, color: AppTheme.greyMedium, size: 16),
          ],
        ),
      ),
    );
  }
}
