import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_profile_provider.dart';
import '../widgets/shimmer_widget.dart';
import '../../../rewards/presentation/providers/reward_provider.dart';

class RewardsTab extends ConsumerWidget {
  const RewardsTab({super.key});

  Future<void> _redeem(BuildContext context, WidgetRef ref, String rewardId, String title, int cost) async {
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
      try {
        await ref.read(redemptionHistoryProvider.notifier).redeemReward(rewardId);
        // Refresh profile to update points balance
        await ref.read(userProfileProvider.notifier).fetchProfile();

        if (context.mounted) {
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
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: AppTheme.primaryRed,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              content: Text(
                e.toString().replaceAll('Exception: ', ''),
                style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.white),
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
    final catalogAsync = ref.watch(rewardCatalogProvider);

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 350),
      switchInCurve: Curves.easeIn,
      switchOutCurve: Curves.easeOut,
      child: profileState.when(
        data: (profile) {
          return SingleChildScrollView(
            key: const ValueKey('loaded'),
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
                  catalogAsync.when(
                    data: (rewards) {
                      if (rewards.isEmpty) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.symmetric(vertical: 32),
                            child: Text('No rewards available in catalog'),
                          ),
                        );
                      }
                      return GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                          childAspectRatio: 0.76,
                        ),
                        itemCount: rewards.length,
                        itemBuilder: (context, index) {
                          final reward = rewards[index];
                          return _buildRewardItem(
                            context,
                            title: reward.title,
                            points: '${reward.pointsRequired} PTS',
                            cost: reward.pointsRequired,
                            desc: reward.description ?? '',
                            icon: _getCategoryIcon(reward.category),
                            color: _getCategoryColor(reward.category),
                            onTap: () => _redeem(context, ref, reward.id, reward.title, reward.pointsRequired),
                          );
                        },
                      );
                    },
                    loading: () => GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.78,
                      children: const [
                        ShimmerCard(height: 160, borderRadius: 24),
                        ShimmerCard(height: 160, borderRadius: 24),
                        ShimmerCard(height: 160, borderRadius: 24),
                        ShimmerCard(height: 160, borderRadius: 24),
                      ],
                    ),
                    error: (err, stack) => Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        child: Text(
                          'Failed to load rewards catalog',
                          style: TextStyle(color: AppTheme.primaryRed.withValues(alpha: 0.8)),
                        ),
                      ),
                    ),
                  ),
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
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const ShimmerLine(width: 130, height: 22),
                  const SizedBox(height: 8),
                  const ShimmerLine(width: 250, height: 14),
                  const SizedBox(height: 24),
                  const ShimmerCard(height: 72, borderRadius: 16),
                  const SizedBox(height: 28),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 0.78,
                    children: const [
                      ShimmerCard(height: 160, borderRadius: 24),
                      ShimmerCard(height: 160, borderRadius: 24),
                      ShimmerCard(height: 160, borderRadius: 24),
                      ShimmerCard(height: 160, borderRadius: 24),
                    ],
                  ),
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
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'gift_card':
        return Icons.card_membership_rounded;
      case 'merchandise':
        return Icons.checkroom_rounded;
      case 'subscription':
        return Icons.workspace_premium_rounded;
      default:
        return Icons.card_giftcard_rounded;
    }
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'gift_card':
        return AppTheme.goldYellow;
      case 'merchandise':
        return AppTheme.primaryRed;
      case 'subscription':
        return Colors.purple;
      default:
        return Colors.blue;
    }
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
            Text(
              title,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
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
