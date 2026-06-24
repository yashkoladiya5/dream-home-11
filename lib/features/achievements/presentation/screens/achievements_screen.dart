import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/achievement.dart';
import '../providers/achievements_provider.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class AchievementsScreen extends ConsumerStatefulWidget {
  const AchievementsScreen({super.key});

  @override
  ConsumerState<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends ConsumerState<AchievementsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.invalidate(checkAchievementsProvider));
  }

  String _formatDate(DateTime date) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  Future<void> _checkNewAchievements() async {
    ref.invalidate(checkAchievementsProvider);
    await ref.read(checkAchievementsProvider.future);
    ref.invalidate(achievementsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final achievementsAsync = ref.watch(achievementsProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Achievements'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: achievementsAsync.when(
        data: (achievements) {
          if (achievements.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.emoji_events_rounded,
                      size: 72,
                      color: AppTheme.greyMedium.withValues(alpha: 0.4),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'No achievements defined',
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          return Column(
            children: [
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(achievementsProvider);
                    await ref.read(achievementsProvider.future);
                  },
                  color: AppTheme.primaryRed,
                  child: ListView.builder(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                    itemCount: achievements.length,
                    itemBuilder: (context, index) {
                      final achievement = achievements[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _AchievementCard(
                          achievement: achievement,
                          formatDate: _formatDate,
                        ),
                      );
                    },
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                child: SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton.icon(
                    onPressed: _checkNewAchievements,
                    icon: const Icon(Icons.refresh_rounded, size: 20),
                    label: const Text('Check for new achievements'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.secondarySlate,
                      foregroundColor: AppTheme.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: AppTheme.greyMedium.withValues(alpha: 0.2)),
                      ),
                      textStyle: Theme.of(context).textTheme.labelLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => SingleChildScrollView(
          physics: const NeverScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Column(
              children: List.generate(
                4,
                (index) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: AppTheme.darkCardGradient,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0x1FFFFFFF)),
                    ),
                    child: Row(
                      children: [
                        const ShimmerCircle(size: 56),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const ShimmerLine(width: 160, height: 14, borderRadius: 6),
                              const SizedBox(height: 8),
                              const ShimmerLine(width: double.infinity, height: 10, borderRadius: 4),
                              const SizedBox(height: 6),
                              const ShimmerLine(width: 120, height: 10, borderRadius: 4),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        const ShimmerLine(width: 60, height: 24, borderRadius: 12),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline_rounded,
                  color: AppTheme.primaryRed,
                  size: 56,
                ),
                const SizedBox(height: 16),
                Text(
                  'Failed to load achievements',
                  style: Theme.of(context).textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.invalidate(achievementsProvider),
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

class _AchievementCard extends StatelessWidget {
  final Achievement achievement;
  final String Function(DateTime) formatDate;

  const _AchievementCard({
    required this.achievement,
    required this.formatDate,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isEarned = achievement.earned;
    final iconData = achievement.iconData;

    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: isEarned ? AppTheme.primaryGradient : null,
                color: isEarned ? null : const Color(0xFF374151),
              ),
              child: Opacity(
                opacity: isEarned ? 1.0 : 0.5,
                child: Icon(
                  iconData,
                  color: isEarned ? AppTheme.white : AppTheme.greyMedium,
                  size: 28,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    achievement.title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isEarned ? AppTheme.white : AppTheme.greyMedium,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    achievement.description ?? '',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontSize: 12,
                      color: AppTheme.greyMedium,
                    ),
                  ),
                  if (isEarned && achievement.earnedAt != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Earned on ${formatDate(achievement.earnedAt!)}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontSize: 11,
                        color: AppTheme.emeraldGreen,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (isEarned)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppTheme.goldYellow.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.stars_rounded,
                      size: 14,
                      color: AppTheme.goldYellow,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '+${achievement.bonusPoints} pts',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.goldYellow,
                      ),
                    ),
                  ],
                ),
              )
            else
              Icon(
                Icons.lock_rounded,
                size: 20,
                color: AppTheme.greyMedium,
              ),
          ],
        ),
      ),
    );
  }
}
