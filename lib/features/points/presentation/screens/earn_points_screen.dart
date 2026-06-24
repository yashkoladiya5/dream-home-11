import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/daily_actions_provider.dart';
import '../providers/streak_provider.dart';
import '../../../../features/dashboard/presentation/widgets/shimmer_widget.dart';
import 'streak_screen.dart';

class EarnPointsScreen extends ConsumerStatefulWidget {
  const EarnPointsScreen({super.key});

  @override
  ConsumerState<EarnPointsScreen> createState() => _EarnPointsScreenState();
}

class _EarnPointsScreenState extends ConsumerState<EarnPointsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(dailyActionsProvider.notifier).fetchTodayActions());
  }

  Future<void> _performAction(String action) async {
    final notifier = ref.read(dailyActionsProvider.notifier);
    final result = await notifier.performAction(action);

    if (result != null && mounted) {
      if (result.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('+${result.finalPoints} points earned!'),
            backgroundColor: AppTheme.emeraldGreen,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
          ),
        );
      } else if (result.reason != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.reason!),
            backgroundColor: AppTheme.primaryRed,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  IconData _actionIcon(String action) {
    switch (action) {
      case 'app_open':
        return Icons.touch_app_rounded;
      case 'daily_login':
        return Icons.login_rounded;
      case 'notification_on':
        return Icons.notifications_active_rounded;
      case 'feed_like_comment':
        return Icons.thumb_up_rounded;
      default:
        return Icons.emoji_events_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final actionsState = ref.watch(dailyActionsProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Earn Points'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: actionsState.when(
        data: (response) => RefreshIndicator(
          onRefresh: () => ref.read(dailyActionsProvider.notifier).fetchTodayActions(),
          color: AppTheme.primaryRed,
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              children: [
                _buildDailyProgress(response),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 24),
                      _buildSectionTitle('Available Actions'),
                      const SizedBox(height: 12),
                      ...response.actions.map((action) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _buildActionCard(action),
                      )),
                      const SizedBox(height: 8),
                      _buildStreakCard(),
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
                  'Failed to load daily actions',
                  style: Theme.of(context).textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.read(dailyActionsProvider.notifier).fetchTodayActions(),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Container(
          width: 4,
          height: 18,
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildDailyProgress(dynamic response) {
    final theme = Theme.of(context);
    final todayPoints = response.todayPoints as int;
    final maxDailyPoints = response.maxDailyPoints as int;
    final overallProgress = response.overallProgress as double;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        border: const Border(
          bottom: BorderSide(color: Color(0x1FFFFFFF)),
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 8),
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppTheme.primaryGradient,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryRed.withValues(alpha: 0.3),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(Icons.stars_rounded, color: Colors.white, size: 30),
          ),
          const SizedBox(height: 16),
          Text(
            'Daily Points',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppTheme.greyMedium,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$todayPoints',
                style: theme.textTheme.displayLarge?.copyWith(
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryRed,
                  height: 1,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 4, left: 4),
                child: Text(
                  '/ $maxDailyPoints pts',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: AppTheme.greyMedium,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: overallProgress.clamp(0.0, 1.0),
              minHeight: 6,
              backgroundColor: Colors.white.withValues(alpha: 0.08),
              valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryRed),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard(dynamic action) {
    final theme = Theme.of(context);
    final act = action as dynamic;
    final actionKey = act.action as String;
    final name = act.name as String;
    final description = act.description as String;
    final basePoints = act.basePoints as int;
    final dailyCap = act.dailyCap as int;
    final todayCount = act.todayCount as int;
    final canPerform = act.canPerform as bool;
    final isComplete = act.isComplete as bool;
    final progress = act.progress as double;

    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isComplete
              ? AppTheme.emeraldGreen.withValues(alpha: 0.2)
              : const Color(0x1FFFFFFF),
        ),
      ),
      child: InkWell(
        onTap: canPerform ? () => _performAction(actionKey) : null,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: isComplete
                          ? AppTheme.emeraldGreen.withValues(alpha: 0.12)
                          : (canPerform
                              ? AppTheme.primaryRed.withValues(alpha: 0.12)
                              : Colors.white.withValues(alpha: 0.05)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      _actionIcon(actionKey),
                      color: isComplete
                          ? AppTheme.emeraldGreen
                          : (canPerform ? AppTheme.primaryRed : AppTheme.greyMedium),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: isComplete
                                ? AppTheme.greyMedium
                                : Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          description,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontSize: 12,
                            color: AppTheme.greyMedium,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.stars_rounded, color: AppTheme.goldYellow, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            '+$basePoints',
                            style: theme.textTheme.bodyLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppTheme.goldYellow,
                              fontSize: 15,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$todayCount / $dailyCap',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontSize: 11,
                          color: isComplete ? AppTheme.emeraldGreen : AppTheme.greyMedium,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(3),
                child: LinearProgressIndicator(
                  value: progress.clamp(0.0, 1.0),
                  minHeight: 4,
                  backgroundColor: Colors.white.withValues(alpha: 0.06),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    isComplete ? AppTheme.emeraldGreen : AppTheme.primaryRed,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                height: 38,
                child: ElevatedButton(
                  onPressed: canPerform ? () => _performAction(actionKey) : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isComplete
                        ? AppTheme.emeraldGreen.withValues(alpha: 0.1)
                        : (canPerform
                            ? AppTheme.primaryRed
                            : Colors.white.withValues(alpha: 0.05)),
                    foregroundColor: isComplete ? AppTheme.emeraldGreen : (canPerform ? Colors.white : AppTheme.greyMedium),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                      side: isComplete
                          ? BorderSide(color: AppTheme.emeraldGreen.withValues(alpha: 0.3))
                          : (canPerform
                              ? BorderSide.none
                              : BorderSide(color: Colors.white.withValues(alpha: 0.08))),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 0),
                  ),
                  child: Text(
                    isComplete
                        ? 'COMPLETED'
                        : (canPerform ? 'CLAIM $basePoints PTS' : 'DAILY LIMIT REACHED'),
                    style: theme.textTheme.labelLarge?.copyWith(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStreakCard() {
    final theme = Theme.of(context);
    final streakAsync = ref.watch(streakProvider);
    final streakInfo = streakAsync.valueOrNull;
    final currentStreak = streakInfo?.currentStreak ?? 0;
    final isOnStreak = streakInfo?.isOnStreak ?? false;
    final nextMilestone = streakInfo?.nextMilestone;
    final daysToNext = streakInfo?.daysToNextMilestone;

    return InkWell(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const StreakScreen()),
      ),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: AppTheme.darkCardGradient,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isOnStreak
                ? AppTheme.primaryRed.withValues(alpha: 0.25)
                : const Color(0x1FFFFFFF),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: isOnStreak
                    ? const LinearGradient(
                        colors: [Color(0xFFFF6B35), AppTheme.primaryRed],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : LinearGradient(
                        colors: [AppTheme.greyMedium.withValues(alpha: 0.2), AppTheme.greyMedium.withValues(alpha: 0.05)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                boxShadow: isOnStreak
                    ? [
                        BoxShadow(
                          color: AppTheme.primaryRed.withValues(alpha: 0.35),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Icon(
                Icons.local_fire_department_rounded,
                color: isOnStreak ? Colors.white : AppTheme.greyMedium,
                size: 26,
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
                        'Login Streak',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: (isOnStreak ? AppTheme.primaryRed : AppTheme.greyMedium).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          isOnStreak ? '$currentStreak day' : '0 days',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: isOnStreak ? AppTheme.primaryRed : AppTheme.greyMedium,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isOnStreak && nextMilestone != null
                        ? '$daysToNext day${daysToNext != null && daysToNext > 1 ? 's' : ''} to $nextMilestone-day milestone'
                        : 'Log in daily to build your streak and earn bonus rewards',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppTheme.greyMedium,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isOnStreak
                    ? AppTheme.primaryRed.withValues(alpha: 0.1)
                    : Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                Icons.chevron_right_rounded,
                color: isOnStreak ? AppTheme.primaryRed : AppTheme.greyMedium,
                size: 20,
              ),
            ),
          ],
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
                const ShimmerCard(height: 140, borderRadius: 16),
                const SizedBox(height: 12),
                const ShimmerCard(height: 140, borderRadius: 16),
                const SizedBox(height: 12),
                const ShimmerCard(height: 140, borderRadius: 16),
                const SizedBox(height: 12),
                const ShimmerCard(height: 140, borderRadius: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
