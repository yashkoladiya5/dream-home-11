import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/winner.dart';
import '../providers/winners_provider.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class WinnersHistoryScreen extends ConsumerWidget {
  const WinnersHistoryScreen({super.key});

  String _formatDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  Color _rankColor(int rank) {
    switch (rank) {
      case 1:
        return AppTheme.goldYellow;
      case 2:
        return AppTheme.greyMedium;
      case 3:
        return const Color(0xFFCD7F32);
      default:
        return AppTheme.greyMedium;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final winnersAsync = ref.watch(winnersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Winners History'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      backgroundColor: AppTheme.darkSlate,
      body: winnersAsync.when(
        loading: () => ListView.builder(
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          itemCount: 4,
          itemBuilder: (context, index) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: ShimmerCard(
              height: 200,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShimmerLine(width: 200, height: 20),
                    const SizedBox(height: 12),
                    ShimmerLine(width: 120, height: 14),
                    const SizedBox(height: 8),
                    ShimmerLine(width: 160, height: 14),
                    const SizedBox(height: 16),
                    ShimmerLine(width: double.infinity, height: 1),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        ShimmerLine(width: 32, height: 32, borderRadius: 16),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ShimmerLine(width: 100, height: 14),
                            const SizedBox(height: 4),
                            ShimmerLine(width: 60, height: 12),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline_rounded,
                  size: 64,
                  color: AppTheme.greyMedium,
                ),
                const SizedBox(height: 16),
                Text(
                  'Failed to load winners',
                  style: Theme.of(context).textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: () => ref.invalidate(winnersProvider),
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
        data: (winners) {
          if (winners.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.emoji_events_outlined,
                      size: 72,
                      color: AppTheme.greyMedium,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'No winners yet',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Complete contests will appear here',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () {
              ref.invalidate(winnersProvider);
              return Future.wait([]);
            },
            child: ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: winners.length,
              itemBuilder: (context, index) {
                final contest = winners[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _WinnerContestCard(
                    contest: contest,
                    formatDate: _formatDate,
                    rankColor: _rankColor,
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _WinnerContestCard extends StatelessWidget {
  final WinnerContest contest;
  final String Function(DateTime) formatDate;
  final Color Function(int) rankColor;

  const _WinnerContestCard({
    required this.contest,
    required this.formatDate,
    required this.rankColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
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
            Text(
              contest.contestTitle,
              style: const TextStyle(
                color: AppTheme.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Prize: ${contest.prize}',
              style: const TextStyle(
                color: AppTheme.goldYellow,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Completed: ${formatDate(contest.completedAt)}',
              style: const TextStyle(
                color: AppTheme.greyMedium,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 16),
            const Divider(
              color: Color(0x1FFFFFFF),
              height: 1,
              thickness: 1,
            ),
            const SizedBox(height: 16),
            ...contest.winners.take(3).map((winner) => _buildWinnerRow(winner)),
          ],
        ),
      ),
    );
  }

  Widget _buildWinnerRow(WinnerEntry winner) {
    final color = rankColor(winner.rank);
    final isRank1 = winner.rank == 1;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withValues(alpha: 0.15),
              border: Border.all(color: color.withValues(alpha: 0.4), width: 1.5),
            ),
            alignment: Alignment.center,
            child: Text(
              '${winner.rank}',
              style: TextStyle(
                color: color,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Row(
              children: [
                Text(
                  winner.userName,
                  style: TextStyle(
                    color: AppTheme.white,
                    fontSize: 15,
                    fontWeight: isRank1 ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                if (isRank1) ...[
                  const SizedBox(width: 6),
                  const Icon(
                    Icons.emoji_events_rounded,
                    color: AppTheme.goldYellow,
                    size: 18,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '${winner.points} pts',
            style: const TextStyle(
              color: AppTheme.goldYellow,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
