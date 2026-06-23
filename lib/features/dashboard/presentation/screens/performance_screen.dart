import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_profile_provider.dart';
import '../widgets/shimmer_widget.dart';
import '../widgets/analytics_header.dart';
import '../widgets/stats_grid.dart';
import '../widgets/analytics_progress.dart';
import '../widgets/achievement_badge.dart';

class PerformanceScreen extends ConsumerStatefulWidget {
  const PerformanceScreen({super.key});

  @override
  ConsumerState<PerformanceScreen> createState() => _PerformanceScreenState();
}

class _PerformanceScreenState extends ConsumerState<PerformanceScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(userStatsProvider.notifier).fetchStats());
  }

  @override
  Widget build(BuildContext context) {
    final statsState = ref.watch(userStatsProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Performance Analytics'),
      ),
      body: statsState.when(
        data: (stats) => RefreshIndicator(
          onRefresh: () => ref.read(userStatsProvider.notifier).fetchStats(),
          color: AppTheme.primaryRed,
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              children: [
                AnalyticsHeader(
                  winRate: stats.winRate,
                  totalContests: stats.totalContestsJoined,
                ),
                const SizedBox(height: 24),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      StatsGrid(
                        totalContestsJoined: stats.totalContestsJoined,
                        totalContestsWon: stats.totalContestsWon,
                        totalPointsEarned: stats.totalPointsEarned,
                        totalEntryFeesSpent: stats.totalEntryFeesSpent,
                      ),
                      const SizedBox(height: 16),
                      AnalyticsProgress(
                        winRate: stats.winRate,
                        totalContestsJoined: stats.totalContestsJoined,
                        totalContestsWon: stats.totalContestsWon,
                        averageRank: stats.averageRank,
                      ),
                      const SizedBox(height: 16),
                      AchievementBadge(
                        winRate: stats.winRate,
                        totalContestsJoined: stats.totalContestsJoined,
                      ),
                      const SizedBox(height: 24),
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
                  'Failed to load performance stats',
                  style: Theme.of(context).textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.read(userStatsProvider.notifier).fetchStats(),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Column(
        children: [
          const SizedBox(height: 200),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                Row(
                  children: const [
                    Expanded(child: ShimmerCard(height: 85, borderRadius: 16)),
                    SizedBox(width: 12),
                    Expanded(child: ShimmerCard(height: 85, borderRadius: 16)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: const [
                    Expanded(child: ShimmerCard(height: 85, borderRadius: 16)),
                    SizedBox(width: 12),
                    Expanded(child: ShimmerCard(height: 85, borderRadius: 16)),
                  ],
                ),
                const SizedBox(height: 16),
                const ShimmerCard(height: 200, borderRadius: 16),
                const SizedBox(height: 16),
                const ShimmerCard(height: 80, borderRadius: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
