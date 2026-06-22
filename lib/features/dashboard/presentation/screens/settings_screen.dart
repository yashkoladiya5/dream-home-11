import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_profile_provider.dart';
import 'edit_profile_screen.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  void _showDummyInfo(BuildContext context, String title, String content) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.secondarySlate,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        content: Text(content, style: const TextStyle(color: AppTheme.greyLight)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('CLOSE', style: TextStyle(color: AppTheme.primaryRed)),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.secondarySlate,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Logout', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Are you sure you want to log out of your account?', style: TextStyle(color: AppTheme.greyLight)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('CANCEL', style: TextStyle(color: AppTheme.greyMedium)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop(); // pop dialog
              Navigator.of(context).pop(); // pop settings
              // In production, we'd clear local storage and route to LoginScreen.
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: AppTheme.primaryRed,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  content: const Text(
                    'Logout request triggered. Session cleared.',
                    style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.white),
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryRed),
            child: const Text('LOGOUT'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(userProfileProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        backgroundColor: AppTheme.darkSlate,
        elevation: 0,
        title: const Text('Account & Settings'),
        centerTitle: true,
      ),
      body: profileState.when(
        data: (profile) {
          final kycStatus = profile.kyc?.status ?? 'unverified';
          Color kycColor = AppTheme.greyMedium;
          if (kycStatus == 'approved') {
            kycColor = AppTheme.emeraldGreen;
          } else if (kycStatus == 'pending') {
            kycColor = AppTheme.goldYellow;
          } else if (kycStatus == 'rejected') {
            kycColor = AppTheme.primaryRed;
          }

          return SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Category: Account Overview
                  _buildSectionHeader('ACCOUNT OVERVIEW'),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0x0CFFFFFF),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0x0FFFFFFF)),
                    ),
                    child: Column(
                      children: [
                        _buildSettingsRow(
                          context,
                          label: 'Full Name',
                          value: profile.fullName ?? 'Not set',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const EditProfileScreen()),
                          ),
                        ),
                        _buildDivider(),
                        _buildSettingsRow(
                          context,
                          label: 'Registered Phone',
                          value: profile.phoneNumber,
                        ),
                        _buildDivider(),
                        _buildSettingsRow(
                          context,
                          label: 'Email',
                          value: profile.email ?? 'Not linked',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const EditProfileScreen()),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Category: Gamification & Stats
                  _buildSectionHeader('TIER & ACTIVITY STATUS'),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0x0CFFFFFF),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0x0FFFFFFF)),
                    ),
                    child: Column(
                      children: [
                        _buildSettingsRow(
                          context,
                          label: 'Current Tier',
                          value: profile.currentTier.toUpperCase(),
                          valueColor: AppTheme.goldYellow,
                        ),
                        _buildDivider(),
                        _buildSettingsRow(
                          context,
                          label: 'Total Accumulated Points',
                          value: '${profile.lifetimePoints} PTS',
                        ),
                        _buildDivider(),
                        _buildSettingsRow(
                          context,
                          label: 'KYC Verification Status',
                          value: kycStatus.toUpperCase(),
                          valueColor: kycColor,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Category: Support & Legal
                  _buildSectionHeader('LEGAL & PLATFORM DETAILS'),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0x0CFFFFFF),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0x0FFFFFFF)),
                    ),
                    child: Column(
                      children: [
                        _buildSettingsRow(
                          context,
                          label: 'How To Play Guide',
                          onTap: () => _showDummyInfo(
                            context,
                            'How to Play',
                            'Earn points by taking daily positive actions in the app! Complete your profile, join contests, invite verified friends, keep streaks active, and redeem unlocked prizes at the Rewards store.',
                          ),
                        ),
                        _buildDivider(),
                        _buildSettingsRow(
                          context,
                          label: 'Terms & Conditions',
                          onTap: () => _showDummyInfo(
                            context,
                            'Terms & Conditions',
                            'All platform entries are strictly behavior-based and non-refundable. Users must be 18+ and outside restricted states to participate in cash features.',
                          ),
                        ),
                        _buildDivider(),
                        _buildSettingsRow(
                          context,
                          label: 'Privacy Policy',
                          onTap: () => _showDummyInfo(
                            context,
                            'Privacy Policy',
                            'We securely store your encrypted tokens and KYC records to ensure platform transparency, double-spend protection, and compliance with local guidelines.',
                          ),
                        ),
                        _buildDivider(),
                        _buildSettingsRow(
                          context,
                          label: 'About Us',
                          onTap: () => _showDummyInfo(
                            context,
                            'About Us',
                            'Dream Home 11 is a behavioral habit-incentivization loyalty platform rewarding user consistency with luxury properties and premium physical rewards.',
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Exit Button
                  OutlinedButton.icon(
                    onPressed: () => _confirmLogout(context),
                    icon: const Icon(Icons.logout_rounded, size: 18),
                    label: const Text('LOG OUT ACCOUNT', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      foregroundColor: AppTheme.primaryRed,
                      side: BorderSide(color: AppTheme.primaryRed.withValues(alpha: 0.5), width: 1.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryRed),
        ),
        error: (err, stack) => Center(
          child: Text('Error: $err', style: const TextStyle(color: AppTheme.primaryRed)),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4.0),
      child: Text(
        title,
        style: const TextStyle(
          color: AppTheme.greyMedium,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 1,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      color: const Color(0x0FFFFFFF),
    );
  }

  Widget _buildSettingsRow(
    BuildContext context, {
    required String label,
    String? value,
    Color? valueColor,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  color: AppTheme.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
            if (value != null) ...[
              Text(
                value,
                style: TextStyle(
                  color: valueColor ?? AppTheme.greyMedium,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const SizedBox(width: 8),
            ],
            if (onTap != null)
              const Icon(
                Icons.chevron_right_rounded,
                color: AppTheme.greyMedium,
                size: 18,
              ),
          ],
        ),
      ),
    );
  }
}
