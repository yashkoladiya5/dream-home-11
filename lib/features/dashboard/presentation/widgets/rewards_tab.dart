import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_profile_provider.dart';

class RewardsTab extends ConsumerWidget {
  const RewardsTab({super.key});

  Future<void> _redeem(BuildContext context, WidgetRef ref, String title, int cost) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.secondarySlate,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          'Redeem Reward',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to redeem "$title" for $cost PTS?',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('CANCEL', style: TextStyle(color: AppTheme.greyMedium)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.goldYellow,
              foregroundColor: AppTheme.darkSlate,
            ),
            child: const Text('CONFIRM', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final success = await ref.read(userProfileProvider.notifier).redeemReward(cost);
      if (context.mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: AppTheme.emeraldGreen,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              content: Text(
                'Successfully redeemed "$title"!',
                style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.white),
              ),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: AppTheme.primaryRed,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              content: const Text(
                'Redemption failed: Insufficient points.',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.white),
              ),
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(userProfileProvider);

    return profileState.when(
      data: (profile) {
        return SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                Text(
                  'Rewards Store',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Redeem points to claim real prizes and bonus tickets.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.greyMedium,
                      ),
                ),
                const SizedBox(height: 24),

                // Current Points Summary
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.goldYellow.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.goldYellow.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.stars_rounded, color: AppTheme.goldYellow, size: 28),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'YOUR POINTS BALANCE',
                            style: TextStyle(
                              color: AppTheme.goldYellow.withValues(alpha: 0.8),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.0,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${profile.pointsBalance} PTS',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.white,
                                ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Rewards Grid
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.78,
                  children: [
                    _buildRewardItem(
                      context,
                      title: 'Free Contest Ticket',
                      points: '1,000 PTS',
                      cost: 1000,
                      desc: '1x entry for any ₹49 contest',
                      icon: Icons.confirmation_number_rounded,
                      color: AppTheme.primaryRed,
                      onTap: () => _redeem(context, ref, 'Free Contest Ticket', 1000),
                    ),
                    _buildRewardItem(
                      context,
                      title: 'Double Points Boost',
                      points: '2,500 PTS',
                      cost: 2500,
                      desc: 'Get 2x points for 24 hours',
                      icon: Icons.bolt_rounded,
                      color: AppTheme.goldYellow,
                      onTap: () => _redeem(context, ref, 'Double Points Boost', 2500),
                    ),
                    _buildRewardItem(
                      context,
                      title: 'Premium Smart TV',
                      points: '85,000 PTS',
                      cost: 85000,
                      desc: '55" 4K Smart OLED Television',
                      icon: Icons.tv_rounded,
                      color: Colors.blue,
                      onTap: () => _redeem(context, ref, 'Premium Smart TV', 85000),
                    ),
                    _buildRewardItem(
                      context,
                      title: 'Apple iPad Air',
                      points: '150,000 PTS',
                      cost: 150000,
                      desc: 'M1 Chip, 10.9" Liquid Retina',
                      icon: Icons.tablet_mac_rounded,
                      color: Colors.purple,
                      onTap: () => _redeem(context, ref, 'Apple iPad Air', 150000),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(48.0),
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryRed),
          ),
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
              const Text('Failed to load rewards details', textAlign: TextAlign.center),
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

  Widget _buildRewardItem(
    BuildContext context, {
    required String title,
    required String points,
    required int cost,
    required String desc,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0x0CFFFFFF),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Reward Icon Circle
            Align(
              alignment: Alignment.topLeft,
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
            ),
            const Spacer(),
            // Title
            Text(
              title,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            // Description
            Text(
              desc,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.greyMedium,
                    fontSize: 11,
                  ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const Divider(height: 20, color: Color(0x12FFFFFF)),
            // Redeem Cost Button
            InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.goldYellow.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.goldYellow.withValues(alpha: 0.2)),
                ),
                child: Center(
                  child: Text(
                    points,
                    style: const TextStyle(
                      color: AppTheme.goldYellow,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
