import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/reward.dart';
import '../providers/reward_provider.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class RewardsCatalogScreen extends ConsumerStatefulWidget {
  const RewardsCatalogScreen({super.key});

  @override
  ConsumerState<RewardsCatalogScreen> createState() => _RewardsCatalogScreenState();
}

class _RewardsCatalogScreenState extends ConsumerState<RewardsCatalogScreen> {
  @override
  Widget build(BuildContext context) {
    final catalogAsync = ref.watch(rewardCatalogProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Rewards Catalog'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: catalogAsync.when(
        data: (rewards) {
          if (rewards.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.shopping_bag_rounded,
                      size: 72,
                      color: AppTheme.greyMedium.withValues(alpha: 0.4),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'No rewards available',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Check back soon for exciting rewards!',
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: AppTheme.greyMedium,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          return GridView.builder(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.72,
            ),
            itemCount: rewards.length,
            itemBuilder: (context, index) {
              final reward = rewards[index];
              return _RewardCard(reward: reward);
            },
          );
        },
        loading: () => GridView.builder(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.72,
          ),
          itemCount: 6,
          itemBuilder: (context, index) => const ShimmerCard(
            height: double.infinity,
            borderRadius: 16,
          ),
        ),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  color: AppTheme.primaryRed,
                  size: 56,
                ),
                const SizedBox(height: 16),
                Text(
                  'Failed to load rewards',
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

class _RewardCard extends ConsumerWidget {
  final Reward reward;

  const _RewardCard({required this.reward});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () => context.push('/rewards/${reward.id}'),
      child: Container(
        decoration: BoxDecoration(
          gradient: AppTheme.darkCardGradient,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x1FFFFFFF)),
        ),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Spacer(),
                  SizedBox(
                    height: 64,
                    width: double.infinity,
                    child: reward.imageUrl != null && reward.imageUrl!.isNotEmpty
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              reward.imageUrl!,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) => Icon(
                                Icons.card_giftcard_rounded,
                                size: 40,
                                color: AppTheme.goldYellow,
                              ),
                              loadingBuilder: (context, child, loadingProgress) {
                                if (loadingProgress == null) return child;
                                return const Center(
                                  child: SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.goldYellow),
                                    ),
                                  ),
                                );
                              },
                            ),
                          )
                        : Icon(
                            Icons.card_giftcard_rounded,
                            size: 40,
                            color: AppTheme.goldYellow,
                          ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    reward.title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.white,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                  const Spacer(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.stars_rounded,
                        size: 16,
                        color: AppTheme.goldYellow,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${reward.pointsRequired}',
                        style: theme.textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppTheme.goldYellow,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (reward.isOutOfStock)
              Container(
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.55),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryRed.withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'OUT OF STOCK',
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: AppTheme.white,
                        fontSize: 11,
                        letterSpacing: 0.8,
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
