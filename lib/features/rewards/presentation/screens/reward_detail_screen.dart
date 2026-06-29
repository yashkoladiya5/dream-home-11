import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/reward.dart';
import '../providers/reward_provider.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class RewardDetailScreen extends ConsumerStatefulWidget {
  final String rewardId;

  const RewardDetailScreen({super.key, required this.rewardId});

  @override
  ConsumerState<RewardDetailScreen> createState() => _RewardDetailScreenState();
}

class _RewardDetailScreenState extends ConsumerState<RewardDetailScreen> {
  bool _isRedeeming = false;

  Future<void> _handleRedeem(Reward reward) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.secondarySlate,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Confirm Redemption',
          style: Theme.of(ctx).textTheme.titleLarge,
        ),
        content: Text(
          'Are you sure you want to redeem this reward for ${reward.pointsRequired} points?',
          style: Theme.of(ctx).textTheme.bodyLarge?.copyWith(color: AppTheme.greyMedium),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(
              'CANCEL',
              style: Theme.of(ctx).textTheme.labelLarge?.copyWith(color: AppTheme.greyMedium),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('CONFIRM'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _isRedeeming = true);

    try {
      await ref.read(redemptionHistoryProvider.notifier).redeemReward(widget.rewardId);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Reward redeemed successfully!'),
          backgroundColor: AppTheme.emeraldGreen,
          behavior: SnackBarBehavior.floating,
        ),
      );

      context.pop();
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: AppTheme.primaryRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isRedeeming = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final catalogAsync = ref.watch(rewardCatalogProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: Text(
          catalogAsync.valueOrNull?.firstWhere(
            (r) => r.id == widget.rewardId,
            orElse: () => Reward(
              id: '',
              title: 'Reward Details',
              pointsRequired: 0,
              category: '',
              isActive: false,
              sortOrder: 0,
              createdAt: DateTime.now(),
            ),
          ).title ?? 'Reward Details',
          overflow: TextOverflow.ellipsis,
        ),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: catalogAsync.when(
        data: (rewards) {
          final reward = rewards.firstWhere(
            (r) => r.id == widget.rewardId,
            orElse: () => Reward(
              id: '',
              title: 'Unknown Reward',
              pointsRequired: 0,
              category: '',
              isActive: false,
              sortOrder: 0,
              createdAt: DateTime.now(),
            ),
          );

          if (reward.id.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.search_off_rounded, size: 56, color: AppTheme.greyMedium.withValues(alpha: 0.4)),
                  const SizedBox(height: 16),
                  Text('Reward not found', style: theme.textTheme.titleLarge),
                ],
              ),
            );
          }

          return SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    height: 200,
                    decoration: BoxDecoration(
                      gradient: AppTheme.darkCardGradient,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0x1FFFFFFF)),
                    ),
                    child: Center(
                      child: Icon(
                        Icons.card_giftcard_rounded,
                        size: 80,
                        color: AppTheme.goldYellow,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    reward.title,
                    style: theme.textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.greyMedium.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      reward.category,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: AppTheme.greyMedium,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    reward.description ?? 'No description available',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: AppTheme.greyMedium,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Divider(color: const Color(0x1FFFFFFF), height: 1),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Icon(Icons.stars_rounded, color: AppTheme.goldYellow, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'POINTS REQUIRED',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: AppTheme.greyMedium,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${reward.pointsRequired} PTS',
                    style: theme.textTheme.displayLarge?.copyWith(
                      color: AppTheme.goldYellow,
                      fontWeight: FontWeight.bold,
                      fontSize: 36,
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (reward.stock != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Text(
                        'Stock: ${reward.stock} remaining',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: reward.isOutOfStock
                              ? AppTheme.primaryRed
                              : AppTheme.greyMedium,
                          fontWeight: reward.isOutOfStock ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ),
                  if (reward.isOutOfStock)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Text(
                        'Out of Stock',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: AppTheme.primaryRed,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: (!reward.isOutOfStock && !_isRedeeming)
                          ? () => _handleRedeem(reward)
                          : null,
                      child: _isRedeeming
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                color: AppTheme.white,
                              ),
                            )
                          : Text(
                              reward.isOutOfStock ? 'OUT OF STOCK' : 'REDEEM - ${reward.pointsRequired} PTS',
                            ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
        loading: () => Padding(
          padding: const EdgeInsets.all(16),
          child: ShimmerCard(height: 400, borderRadius: 16),
        ),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 56),
                const SizedBox(height: 16),
                Text(
                  'Failed to load reward details',
                  style: theme.textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.invalidate(rewardCatalogProvider),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
