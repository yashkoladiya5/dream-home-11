import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_profile_provider.dart';
import '../widgets/shimmer_widget.dart';
import '../screens/edit_profile_screen.dart';
import '../screens/performance_screen.dart';
import '../screens/settings_screen.dart';
import '../../../points/presentation/screens/multiplier_screen.dart';

class ProfileTab extends ConsumerWidget {
  const ProfileTab({super.key});

  Widget _getAvatarWidget(String? code) {
    IconData iconData = Icons.person_rounded;
    Color iconColor = AppTheme.white;

    switch (code) {
      case 'gamer':
        iconData = Icons.sports_esports_rounded;
        iconColor = AppTheme.primaryRed;
        break;
      case 'champion':
        iconData = Icons.emoji_events_rounded;
        iconColor = AppTheme.goldYellow;
        break;
      case 'elite':
        iconData = Icons.workspace_premium_rounded;
        iconColor = AppTheme.emeraldGreen;
        break;
      case 'lightning':
        iconData = Icons.flash_on_rounded;
        iconColor = Colors.cyan;
        break;
      case 'star':
        iconData = Icons.star_rounded;
        iconColor = Colors.amber;
        break;
      default:
        iconData = Icons.person_rounded;
        iconColor = AppTheme.white;
        break;
    }

    return Center(
      child: Icon(
        iconData,
        size: 46,
        color: iconColor,
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(userProfileProvider);

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 350),
      switchInCurve: Curves.easeIn,
      switchOutCurve: Curves.easeOut,
      child: profileState.when(
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
            key: const ValueKey('loaded'),
            physics: const BouncingScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 12),
                  
                  // Profile Avatar Card
                  Center(
                    child: Column(
                      children: [
                        Container(
                          width: 90,
                          height: 90,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.primaryRed, width: 3),
                            gradient: AppTheme.primaryGradient,
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primaryRed.withValues(alpha: 0.25),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: _getAvatarWidget(profile.avatarUrl),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          profile.fullName ?? 'Player 1',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.2,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          profile.phoneNumber,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.greyMedium,
                              ),
                        ),
                        const SizedBox(height: 12),
                        // Edit Profile pill button
                        ElevatedButton.icon(
                          onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const EditProfileScreen()),
                          ),
                          icon: const Icon(Icons.edit_rounded, size: 14),
                          label: const Text('EDIT PROFILE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0x0CFFFFFF),
                            foregroundColor: AppTheme.white,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                              side: const BorderSide(color: Color(0x1AFFFFFF)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 28),

                  // Stats row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildStatCard(
                        context,
                        title: 'Points Balance',
                        value: '${profile.pointsBalance} PTS',
                        icon: Icons.stars_rounded,
                        iconColor: AppTheme.goldYellow,
                      ),
                      _buildStatCard(
                        context,
                        title: 'Wallet Balance',
                        value: '₹${profile.walletBalanceInr.toStringAsFixed(2)}',
                        icon: Icons.account_balance_wallet_rounded,
                        iconColor: AppTheme.emeraldGreen,
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),

                  // Details list
                  _buildInfoTile(
                    context,
                    label: 'KYC Verification',
                    value: kycStatus.toUpperCase(),
                    valueColor: kycColor,
                    icon: Icons.verified_user_rounded,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const SettingsScreen()),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildInfoTile(
                    context,
                    label: 'Membership Tier',
                    value: profile.currentTier.toUpperCase(),
                    valueColor: AppTheme.goldYellow,
                    icon: Icons.workspace_premium_rounded,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const SettingsScreen()),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildInfoTile(
                    context,
                    label: 'Registered Email',
                    value: profile.email ?? 'Not linked',
                    icon: Icons.mail_rounded,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const EditProfileScreen()),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildInfoTile(
                    context,
                    label: 'Account & Settings',
                    value: 'MANAGE',
                    valueColor: AppTheme.primaryRed,
                    icon: Icons.settings_rounded,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const SettingsScreen()),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildInfoTile(
                    context,
                    label: 'Performance Analytics',
                    value: 'VIEW',
                    valueColor: AppTheme.primaryRed,
                    icon: Icons.analytics_rounded,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const PerformanceScreen()),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildInfoTile(
                    context,
                    label: 'Points Multiplier',
                    value: 'VIEW',
                    valueColor: AppTheme.primaryRed,
                    icon: Icons.speed_rounded,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const MultiplierScreen()),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildInfoTile(
                    context,
                    label: 'Rewards Catalog',
                    value: 'REDEEM',
                    valueColor: AppTheme.primaryRed,
                    icon: Icons.card_giftcard_rounded,
                    onTap: () => context.push('/rewards'),
                  ),
                  const SizedBox(height: 12),
                  _buildInfoTile(
                    context,
                    label: 'Share & Earn',
                    value: 'EARN',
                    valueColor: AppTheme.primaryRed,
                    icon: Icons.share_rounded,
                    onTap: () => context.push('/share-tracker'),
                  ),
                  const SizedBox(height: 12),
                  _buildInfoTile(
                    context,
                    label: 'Reminders',
                    value: 'SET',
                    valueColor: AppTheme.primaryRed,
                    icon: Icons.notifications_active_rounded,
                    onTap: () => context.push('/reminders'),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
        loading: () {
          return SingleChildScrollView(
            key: const ValueKey('loading'),
            physics: const NeverScrollableScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 12),
                  const ShimmerCircle(size: 90),
                  const SizedBox(height: 16),
                  const ShimmerLine(width: 130, height: 20),
                  const SizedBox(height: 6),
                  const ShimmerLine(width: 100, height: 12),
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      ShimmerCard(width: 165, height: 72, borderRadius: 20),
                      ShimmerCard(width: 165, height: 72, borderRadius: 20),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const ShimmerCard(height: 56, borderRadius: 16),
                  const SizedBox(height: 12),
                  const ShimmerCard(height: 56, borderRadius: 16),
                  const SizedBox(height: 12),
                  const ShimmerCard(height: 56, borderRadius: 16),
                ],
              ),
            ),
          );
        },
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 48),
                const SizedBox(height: 16),
                Text(
                  'Failed to load profile details',
                  style: Theme.of(context).textTheme.titleMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.read(userProfileProvider.notifier).fetchProfile(),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required String title,
    required String value,
    required IconData icon,
    required Color iconColor,
  }) {
    return Container(
      width: MediaQuery.of(context).size.width * 0.43,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0x0CFFFFFF),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0x0FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.greyMedium,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w900,
                  fontSize: 18,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoTile(
    BuildContext context, {
    required String label,
    required String value,
    required IconData icon,
    Color? valueColor,
    VoidCallback? onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0x0CFFFFFF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x0FFFFFFF)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Icon(icon, color: AppTheme.greyMedium, size: 20),
              const SizedBox(width: 16),
              Text(
                label,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const Spacer(),
              Text(
                value,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: valueColor ?? AppTheme.white,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              if (onTap != null) ...[
                const SizedBox(width: 8),
                const Icon(Icons.chevron_right_rounded, color: AppTheme.greyMedium, size: 18),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

