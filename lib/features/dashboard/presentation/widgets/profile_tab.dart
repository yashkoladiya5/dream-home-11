import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_profile_provider.dart';

class ProfileTab extends ConsumerWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(userProfileProvider);

    return profileState.when(
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
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.person_rounded,
                            size: 48,
                            color: AppTheme.white,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        profile.fullName ?? 'Player 1',
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        profile.phoneNumber,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppTheme.greyMedium,
                            ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 32),

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
                ),
                const SizedBox(height: 12),
                _buildInfoTile(
                  context,
                  label: 'Membership Tier',
                  value: profile.currentTier.toUpperCase(),
                  valueColor: AppTheme.goldYellow,
                  icon: Icons.workspace_premium_rounded,
                ),
                const SizedBox(height: 12),
                _buildInfoTile(
                  context,
                  label: 'Registered Email',
                  value: profile.email ?? 'Not linked',
                  icon: Icons.mail_rounded,
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        );
      },
      loading: () => const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryRed),
        ),
      ),
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
        border: Border.all(color: const Color(0x1FFFFFFF)),
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
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0x0CFFFFFF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x0FFFFFFF)),
      ),
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
        ],
      ),
    );
  }
}
