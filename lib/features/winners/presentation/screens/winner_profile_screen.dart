import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/winners_provider.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class WinnerProfileScreen extends ConsumerWidget {
  final String contestId;
  final String winnerUserId;

  const WinnerProfileScreen({
    super.key,
    required this.contestId,
    required this.winnerUserId,
  });

  String _formatDate(String dateStr) {
    final dt = DateTime.parse(dateStr);
    return '${dt.day}/${dt.month}/${dt.year}';
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
    final detailAsync = ref.watch(contestWinnerDetailProvider(contestId));

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Winner Profile'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: detailAsync.when(
        loading: () => SingleChildScrollView(
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const SizedBox(height: 20),
              const Center(child: ShimmerCircle(size: 90)),
              const SizedBox(height: 16),
              const Center(child: ShimmerLine(width: 150, height: 24)),
              const SizedBox(height: 8),
              const Center(child: ShimmerLine(width: 100, height: 16)),
              const SizedBox(height: 32),
              for (int i = 0; i < 3; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: ShimmerCard(height: 120),
                ),
            ],
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
                  size: 64,
                  color: AppTheme.greyMedium,
                ),
                const SizedBox(height: 16),
                Text(
                  'Failed to load winner details',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => ref.invalidate(contestWinnerDetailProvider(contestId)),
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
        data: (data) {
          final contestTitle = data['contestTitle'] as String? ?? '';
          final prize = data['prize'] as String? ?? 'N/A';
          final completedAt = data['completedAt'] as String? ?? '';
          final totalParticipants = data['totalParticipants'] as int? ?? 0;
          final winners = (data['winners'] as List?)?.cast<Map<String, dynamic>>() ?? [];

          final winnerData = winners.firstWhere(
            (w) => w['userId'] as String == winnerUserId,
            orElse: () => <String, dynamic>{},
          );

          if (winnerData.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.person_off_rounded,
                      size: 64,
                      color: AppTheme.greyMedium,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Winner not found',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          final rank = winnerData['rank'] as int? ?? 0;
          final userName = winnerData['userName'] as String? ?? 'Anonymous';
          final points = winnerData['points'] as int? ?? 0;
          final rankColor = _rankColor(rank);

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(contestWinnerDetailProvider(contestId));
              await ref.read(contestWinnerDetailProvider(contestId).future);
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Center(
                    child: Column(
                      children: [
                        Container(
                          width: 90,
                          height: 90,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: AppTheme.primaryGradient,
                            border: Border.all(color: rankColor, width: 3),
                          ),
                          child: Center(
                            child: Icon(
                              Icons.emoji_events_rounded,
                              size: 44,
                              color: rankColor,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          userName,
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: rankColor,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Rank #$rank',
                            style: const TextStyle(
                              color: AppTheme.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Container(
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
                            const Icon(Icons.emoji_events_rounded, color: AppTheme.goldYellow, size: 20),
                            const SizedBox(width: 10),
                            Text(
                              contestTitle,
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Prize: $prize',
                          style: const TextStyle(
                            color: AppTheme.goldYellow,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Completed: ${_formatDate(completedAt)}',
                          style: const TextStyle(
                            color: AppTheme.greyMedium,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0x0CFFFFFF),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.people_rounded, color: AppTheme.greyMedium, size: 16),
                              const SizedBox(width: 6),
                              Text(
                                '$totalParticipants participants',
                                style: const TextStyle(
                                  color: AppTheme.greyMedium,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
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
                            const Icon(Icons.stars_rounded, color: AppTheme.goldYellow, size: 20),
                            const SizedBox(width: 10),
                            Text(
                              'Points Earned',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Center(
                          child: Text(
                            '$points',
                            style: const TextStyle(
                              color: AppTheme.goldYellow,
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Center(
                          child: Text(
                            'points',
                            style: TextStyle(
                              color: AppTheme.greyMedium,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (prize.isNotEmpty && prize != 'N/A') ...[
                    const SizedBox(height: 16),
                    Container(
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
                              const Icon(Icons.card_giftcard_rounded, color: AppTheme.goldYellow, size: 20),
                              const SizedBox(width: 10),
                              Text(
                                'Prize',
                                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            prize,
                            style: const TextStyle(
                              color: AppTheme.goldYellow,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
