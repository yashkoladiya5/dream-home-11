import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/streak_provider.dart';
import '../../../../features/dashboard/presentation/widgets/shimmer_widget.dart';

class StreakScreen extends ConsumerStatefulWidget {
  const StreakScreen({super.key});

  @override
  ConsumerState<StreakScreen> createState() => _StreakScreenState();
}

class _StreakScreenState extends ConsumerState<StreakScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(streakProvider.notifier).fetchStreakInfo());
  }

  @override
  Widget build(BuildContext context) {
    final streakState = ref.watch(streakProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Login Streak'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: streakState.when(
        data: (info) => RefreshIndicator(
          onRefresh: () => ref.read(streakProvider.notifier).fetchStreakInfo(),
          color: AppTheme.primaryRed,
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              children: [
                _buildStreakHero(info),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      const SizedBox(height: 20),
                      _buildStreakProgress(info),
                      const SizedBox(height: 20),
                      _buildMilestoneRewards(info),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        loading: () => _buildShimmer(),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 48),
                const SizedBox(height: 16),
                Text(
                  'Failed to load streak info',
                  style: Theme.of(context).textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.read(streakProvider.notifier).fetchStreakInfo(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryRed,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStreakHero(dynamic info) {
    final theme = Theme.of(context);
    final currentStreak = info.currentStreak as int;
    final longestStreak = info.longestStreak as int;
    final isOnStreak = info.isOnStreak as bool;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 28),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF7F1D1D),
            const Color(0xFF450A0A),
            AppTheme.darkSlate,
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          stops: const [0.0, 0.4, 1.0],
        ),
        border: const Border(
          bottom: BorderSide(color: Color(0x1FFFFFFF)),
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 4),
          Stack(
            alignment: Alignment.center,
            children: [
              if (isOnStreak)
                Container(
                  width: 130,
                  height: 130,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryRed.withValues(alpha: 0.15),
                        blurRadius: 40,
                        spreadRadius: 10,
                      ),
                    ],
                  ),
                ),
              Container(
                width: 104,
                height: 104,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: isOnStreak
                      ? const LinearGradient(
                          colors: [Color(0xFFFF6B35), AppTheme.primaryRed, Color(0xFF7F1D1D)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : LinearGradient(
                          colors: [AppTheme.greyMedium.withValues(alpha: 0.15), AppTheme.greyMedium.withValues(alpha: 0.05)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                  border: Border.all(
                    color: isOnStreak
                        ? const Color(0xFFFF6B35).withValues(alpha: 0.4)
                        : Colors.white.withValues(alpha: 0.08),
                    width: 2.5,
                  ),
                  boxShadow: isOnStreak
                      ? [
                          BoxShadow(
                            color: const Color(0xFFFF6B35).withValues(alpha: 0.3),
                            blurRadius: 20,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : null,
                ),
                child: Icon(
                  Icons.local_fire_department_rounded,
                  color: isOnStreak ? Colors.white : AppTheme.greyMedium,
                  size: 48,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            '$currentStreak',
            style: theme.textTheme.displayLarge?.copyWith(
              fontSize: 56,
              fontWeight: FontWeight.w900,
              color: isOnStreak ? Colors.white : AppTheme.greyMedium,
              height: 1.05,
              shadows: isOnStreak
                  ? [
                      Shadow(
                        color: AppTheme.primaryRed.withValues(alpha: 0.4),
                        blurRadius: 12,
                      ),
                    ]
                  : null,
            ),
          ),
          const SizedBox(height: 2),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.local_fire_department_rounded,
                size: 14,
                color: isOnStreak ? AppTheme.primaryRed : AppTheme.greyMedium,
              ),
              const SizedBox(width: 6),
              Text(
                'DAY STREAK',
                style: theme.textTheme.labelLarge?.copyWith(
                  color: isOnStreak ? Colors.white : AppTheme.greyMedium,
                  fontSize: 13,
                  letterSpacing: 2.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  (isOnStreak ? AppTheme.primaryRed : AppTheme.greyMedium).withValues(alpha: 0.12),
                  (isOnStreak ? AppTheme.primaryRed : AppTheme.greyMedium).withValues(alpha: 0.05),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: (isOnStreak ? AppTheme.primaryRed : AppTheme.greyMedium).withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.emoji_events_rounded,
                  size: 14,
                  color: isOnStreak ? AppTheme.goldYellow : AppTheme.greyMedium,
                ),
                const SizedBox(width: 6),
                Text(
                  'Best: $longestStreak day${longestStreak != 1 ? 's' : ''}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: isOnStreak ? AppTheme.goldYellow : AppTheme.greyMedium,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStreakProgress(dynamic info) {
    final theme = Theme.of(context);
    final currentStreak = info.currentStreak as int;
    final nextMilestone = info.nextMilestone as int?;
    final daysToNextMilestone = info.daysToNextMilestone as int?;
    final nextMilestoneReward = info.nextMilestoneReward as int?;
    final progress = info.progress as double;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFFFF6B35).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.local_fire_department_rounded, color: Color(0xFFFF6B35), size: 18),
              ),
              const SizedBox(width: 12),
              Text(
                'Streak Progress',
                style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: currentStreak > 0
                      ? const Color(0xFFFF6B35).withValues(alpha: 0.12)
                      : Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  currentStreak > 0 ? 'Day $currentStreak' : 'No streak',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: currentStreak > 0 ? const Color(0xFFFF6B35) : AppTheme.greyMedium,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          if (nextMilestone != null && nextMilestoneReward != null) ...[
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Progress to $nextMilestone-day',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: AppTheme.greyMedium,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$currentStreak / $nextMilestone days',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppTheme.goldYellow.withValues(alpha: 0.15),
                        AppTheme.goldYellow.withValues(alpha: 0.05),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.goldYellow.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.stars_rounded, color: AppTheme.goldYellow, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        '+$nextMilestoneReward pts',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: AppTheme.goldYellow,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress.clamp(0.0, 1.0),
                minHeight: 8,
                backgroundColor: Colors.white.withValues(alpha: 0.08),
                valueColor: AlwaysStoppedAnimation<Color>(
                  currentStreak >= nextMilestone - 2
                      ? AppTheme.goldYellow
                      : const Color(0xFFFF6B35),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              daysToNextMilestone != null && daysToNextMilestone > 0
                  ? '$daysToNextMilestone more day${daysToNextMilestone > 1 ? 's' : ''} to reach $nextMilestone-day streak milestone!'
                  : 'Milestone reached! Claim your reward.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppTheme.greyMedium,
                fontSize: 12,
                fontWeight: daysToNextMilestone != null && daysToNextMilestone <= 3
                    ? FontWeight.w600
                    : null,
              ),
            ),
          ] else ...[
            const SizedBox(height: 18),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.goldYellow.withValues(alpha: 0.1),
                    AppTheme.goldYellow.withValues(alpha: 0.03),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.goldYellow.withValues(alpha: 0.15)),
              ),
              child: Column(
                children: [
                  const Icon(Icons.workspace_premium_rounded, color: AppTheme.goldYellow, size: 24),
                  const SizedBox(height: 8),
                  Text(
                    'ALL MILESTONES COMPLETED',
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: AppTheme.goldYellow,
                      fontSize: 12,
                      letterSpacing: 1.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'You have conquered every streak milestone!',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppTheme.greyMedium,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMilestoneRewards(dynamic info) {
    final theme = Theme.of(context);
    final currentStreak = info.currentStreak as int;

    final milestones = [
      {
        'days': 7,
        'reward': 100,
        'icon': Icons.emoji_events_rounded,
        'color': const Color(0xFFFFD700),
        'bgGradient': LinearGradient(
          colors: [const Color(0xFFFFD700).withValues(alpha: 0.1), const Color(0xFFFFD700).withValues(alpha: 0.03)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      },
      {
        'days': 30,
        'reward': 600,
        'icon': Icons.diamond_rounded,
        'color': const Color(0xFF00BFFF),
        'bgGradient': LinearGradient(
          colors: [const Color(0xFF00BFFF).withValues(alpha: 0.1), const Color(0xFF00BFFF).withValues(alpha: 0.03)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFF6B35), AppTheme.primaryRed],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.emoji_events_rounded, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 10),
            Text(
              'Milestone Rewards',
              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 16),
        ...milestones.asMap().entries.map((entry) {
          final index = entry.key;
          final m = entry.value;
          final days = m['days'] as int;
          final reward = m['reward'] as int;
          final icon = m['icon'] as IconData;
          final color = m['color'] as Color;
          final bgGradient = m['bgGradient'] as LinearGradient;
          final isReached = currentStreak >= days;
          final progressToMilestone = (currentStreak / days).clamp(0.0, 1.0);

          return Padding(
            padding: EdgeInsets.only(bottom: index < milestones.length - 1 ? 8 : 0),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: isReached ? bgGradient : AppTheme.darkCardGradient,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isReached
                      ? color.withValues(alpha: 0.2)
                      : const Color(0x1FFFFFFF),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isReached
                          ? color.withValues(alpha: 0.15)
                          : Colors.white.withValues(alpha: 0.05),
                      border: Border.all(
                        color: isReached
                            ? color.withValues(alpha: 0.3)
                            : Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                    child: Icon(
                      icon,
                      color: isReached ? color : AppTheme.greyMedium,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              '$days-Day Streak',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: isReached ? color : Colors.white,
                                fontSize: 15,
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (isReached)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.check_rounded, size: 10, color: AppTheme.emeraldGreen),
                                    const SizedBox(width: 2),
                                    Text(
                                      'DONE',
                                      style: theme.textTheme.bodyMedium?.copyWith(
                                        color: AppTheme.emeraldGreen,
                                        fontSize: 8,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        if (!isReached) ...[
                          ClipRRect(
                            borderRadius: BorderRadius.circular(2),
                            child: LinearProgressIndicator(
                              value: progressToMilestone,
                              minHeight: 4,
                              backgroundColor: Colors.white.withValues(alpha: 0.06),
                              valueColor: AlwaysStoppedAnimation<Color>(color),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '$currentStreak / $days days',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: AppTheme.greyMedium,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isReached
                          ? AppTheme.emeraldGreen.withValues(alpha: 0.1)
                          : color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isReached
                            ? AppTheme.emeraldGreen.withValues(alpha: 0.2)
                            : color.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Text(
                      '+$reward',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: isReached ? AppTheme.emeraldGreen : color,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildShimmer() {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Column(
        children: [
          const SizedBox(height: 280),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                const ShimmerCard(height: 160, borderRadius: 16),
                const SizedBox(height: 16),
                const ShimmerCard(height: 100, borderRadius: 16),
                const SizedBox(height: 8),
                const ShimmerCard(height: 100, borderRadius: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
