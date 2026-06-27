import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/my_home_contests_provider.dart';
import '../../data/models/home_contest_model.dart';

class MyHomeContestScreen extends ConsumerWidget {
  const MyHomeContestScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contestsState = ref.watch(myHomeContestsProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('My Contests'),
        centerTitle: true,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(myHomeContestsProvider.notifier).fetchMyHomeContests(),
        color: AppTheme.primaryRed,
        child: contestsState.when(
          data: (contests) {
            if (contests.isEmpty) {
              return ListView(
                children: [
                  SizedBox(
                    height: MediaQuery.of(context).size.height * 0.6,
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0x1AFFFFFF),
                            ),
                            child: const Icon(
                              Icons.sports_esports_rounded,
                              size: 40,
                              color: AppTheme.greyMedium,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'No active contests yet',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Join a contest to see it here',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: AppTheme.greyMedium,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: contests.length,
              itemBuilder: (context, index) {
                return _MyContestCard(contest: contests[index]);
              },
            );
          },
          loading: () => const _ShimmerList(),
          error: (err, stack) => ListView(
            children: [
              SizedBox(
                height: MediaQuery.of(context).size.height * 0.6,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0x1AFFFFFF),
                        ),
                        child: const Icon(
                          Icons.error_outline_rounded,
                          size: 40,
                          color: AppTheme.primaryRed,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Failed to load your contests',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        err.toString(),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppTheme.greyMedium,
                            ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => ref.read(myHomeContestsProvider.notifier).fetchMyHomeContests(),
                        icon: const Icon(Icons.refresh_rounded, size: 18),
                        label: const Text('RETRY'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryRed,
                          foregroundColor: AppTheme.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MyContestCard extends StatelessWidget {
  final HomeContestModel contest;

  const _MyContestCard({required this.contest});

  @override
  Widget build(BuildContext context) {
    final isRunning = contest.status == 'running';
    final isCompleted = contest.status == 'completed';

    final statusColor = isRunning
        ? AppTheme.emeraldGreen
        : isCompleted
            ? AppTheme.greyMedium
            : AppTheme.goldYellow;

    final statusLabel = contest.status.toUpperCase();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    contest.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
                if (contest.badgeText != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _parseBadgeColor(contest.badgeColor).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      contest.badgeText!,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: _parseBadgeColor(contest.badgeColor),
                      ),
                    ),
                  ),
                if (contest.badgeText != null) const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    statusLabel,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                _buildRankBadge(context),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'My Points',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppTheme.greyMedium,
                              fontSize: 11,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${contest.myPoints} pts',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w900,
                              fontSize: 20,
                              color: AppTheme.goldYellow,
                            ),
                      ),
                    ],
                  ),
                ),
                if (contest.prize != null)
                  SizedBox(
                    width: 120,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'Prize',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppTheme.greyMedium,
                                fontSize: 11,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          contest.prize!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.end,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppTheme.goldYellow,
                                fontSize: 13,
                              ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),

            _buildProgressSection(context),
          ],
        ),
      ),
    );
  }

  Widget _buildRankBadge(BuildContext context) {
    final isFirst = contest.myRank == 1;
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: isFirst ? AppTheme.goldGradient : AppTheme.darkCardGradient,
        border: Border.all(
          color: isFirst ? AppTheme.goldYellow : const Color(0x2FFFFFFF),
          width: 2,
        ),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '#${contest.myRank}',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                    color: isFirst ? AppTheme.darkSlate : AppTheme.white,
                  ),
            ),
            Text(
              'of ${contest.totalMembers}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontSize: 8,
                    color: isFirst ? AppTheme.darkSlate : AppTheme.greyMedium,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Points Progress',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.greyMedium,
                    fontSize: 11,
                  ),
            ),
            const Spacer(),
            if (contest.pointsToFirst != null && contest.pointsToFirst! > 0)
              Flexible(
                child: Text(
                  '${contest.pointsToFirst} pts to #1',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.primaryRed,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                ),
              )
            else if (contest.pointsToFirst != null)
              Text(
                'YOU\'RE #1!',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.emeraldGreen,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
              ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: contest.totalMembers > 0
                ? (contest.myRank / contest.totalMembers).clamp(0.0, 1.0)
                : 0.0,
            backgroundColor: const Color(0x1AFFFFFF),
            valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.emeraldGreen),
            minHeight: 6,
          ),
        ),
        const SizedBox(height: 12),

        if (contest.status == 'running') ...[
          Row(
            children: [
              Text(
                'Time Elapsed',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.greyMedium,
                      fontSize: 11,
                    ),
              ),
              const Spacer(),
              Text(
                '${contest.progressPercentage.round()}%',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.greyMedium,
                      fontSize: 11,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: contest.progressPercentage / 100,
              backgroundColor: const Color(0x1AFFFFFF),
              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.goldYellow),
              minHeight: 6,
            ),
          ),
        ],

        if (contest.status == 'upcoming') ...[
          const SizedBox(height: 4),
          Text(
            'Starts ${_formatDateTime(contest.startTime)}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.greyMedium,
                  fontSize: 11,
                ),
          ),
        ],

        if (contest.status == 'completed') ...[
          const SizedBox(height: 4),
          Text(
            'Ended ${_formatDateTime(contest.endTime)}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.greyMedium,
                  fontSize: 11,
                ),
          ),
        ],
      ],
    );
  }

  String _formatDateTime(DateTime dt) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${dt.day} ${months[dt.month - 1]}, ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  Color _parseBadgeColor(String? colorStr) {
    if (colorStr == null) return AppTheme.primaryRed;
    try {
      return Color(int.parse(colorStr.replaceFirst('#', '0xFF')));
    } catch (_) {
      return AppTheme.primaryRed;
    }
  }
}

class _ShimmerList extends StatelessWidget {
  const _ShimmerList();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 4,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0x0CFFFFFF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x1AFFFFFF)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 180,
                height: 16,
                decoration: BoxDecoration(
                  color: const Color(0x1AFFFFFF),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Color(0x1AFFFFFF),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 80,
                        height: 12,
                        decoration: BoxDecoration(
                          color: const Color(0x1AFFFFFF),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: 100,
                        height: 20,
                        decoration: BoxDecoration(
                          color: const Color(0x1AFFFFFF),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                height: 6,
                decoration: BoxDecoration(
                  color: const Color(0x1AFFFFFF),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
