import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/poll_models.dart';
import '../providers/polls_provider.dart';

class VoteScreen extends ConsumerStatefulWidget {
  const VoteScreen({super.key});

  @override
  ConsumerState<VoteScreen> createState() => _VoteScreenState();
}

class _VoteScreenState extends ConsumerState<VoteScreen> {
  int? _selectedOption;
  bool _voted = false;

  @override
  Widget build(BuildContext context) {
    final activePoll = ref.watch(activePollProvider);
    final voteState = ref.watch(pollVoteProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Daily Poll'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: SafeArea(
        child: activePoll.when(
          data: (poll) {
            if (poll == null) {
              return _buildEmptyState();
            }
            return _buildPollContent(poll, voteState);
          },
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppTheme.goldYellow),
          ),
          error: (err, _) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 48),
                const SizedBox(height: 16),
                Text(
                  'Failed to load poll',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.greyMedium,
                      ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.refresh(activePollProvider),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.goldYellow.withValues(alpha: 0.1),
              ),
              child: Icon(
                Icons.how_to_vote_rounded,
                color: AppTheme.goldYellow.withValues(alpha: 0.5),
                size: 40,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No Active Poll',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
            ),
            const SizedBox(height: 12),
            Text(
              'Check back later for a new daily poll!',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.greyMedium,
                  ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => ref.refresh(activePollProvider),
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('REFRESH'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0x0CFFFFFF),
                foregroundColor: AppTheme.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: Color(0x1AFFFFFF)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPollContent(Poll poll, AsyncValue<PollVoteResponse?> voteState) {
    final hasVoted = _voted || voteState.hasValue && voteState.valueOrNull != null;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.goldYellow.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'DAILY POLL',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: AppTheme.goldYellow,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1,
                            ),
                      ),
                    ),
                    const Spacer(),
                    if (hasVoted)
                      Text(
                        '${poll.totalVotes} votes',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppTheme.greyMedium,
                            ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  poll.question,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${_formatDate(poll.activeFrom)} - ${_formatDate(poll.activeTo)}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.greyMedium,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          if (voteState.isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(color: AppTheme.goldYellow),
              ),
            )
          else if (hasVoted)
            _buildResults(poll, voteState)
          else
            _buildOptions(poll),
        ],
      ),
    );
  }

  Widget _buildOptions(Poll poll) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Choose your answer:',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
        ),
        const SizedBox(height: 12),
        ...List.generate(poll.options.length, (i) {
          final isSelected = _selectedOption == i;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: InkWell(
              onTap: () => setState(() => _selectedOption = i),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.goldYellow.withValues(alpha: 0.15)
                      : const Color(0x0CFFFFFF),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected
                        ? AppTheme.goldYellow.withValues(alpha: 0.5)
                        : const Color(0x0FFFFFFF),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isSelected
                            ? AppTheme.goldYellow
                            : const Color(0x1AFFFFFF),
                      ),
                      child: Center(
                        child: Text(
                          '${i + 1}',
                          style: TextStyle(
                            color: isSelected ? Colors.black : AppTheme.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        poll.options[i],
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              color: Colors.white,
                            ),
                      ),
                    ),
                    if (isSelected)
                      const Icon(
                        Icons.check_circle_rounded,
                        color: AppTheme.goldYellow,
                        size: 20,
                      ),
                  ],
                ),
              ),
            ),
          );
        }),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _selectedOption == null
                ? null
                : () => _submitVote(poll.id, _selectedOption!),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.goldYellow,
              foregroundColor: Colors.black,
              disabledBackgroundColor: const Color(0x1AFFFFFF),
              disabledForegroundColor: AppTheme.greyMedium,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: const Text(
              'SUBMIT VOTE',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.stars_rounded,
                color: AppTheme.goldYellow,
                size: 14,
              ),
              const SizedBox(width: 6),
              Text(
                'Earn 20 points for voting!',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.greyMedium,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildResults(Poll poll, AsyncValue<PollVoteResponse?> voteState) {
    final response = voteState.valueOrNull;
    final results = response?.results ?? [];
    final totalVotes = response?.totalVotes ?? poll.totalVotes;
    final userVoteIdx = response?.userVote ?? _selectedOption ?? -1;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Icon(Icons.bar_chart_rounded, color: AppTheme.goldYellow, size: 18),
            const SizedBox(width: 8),
            Text(
              'Results',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (response?.success == true && response?.pointsAwarded != null && response!.pointsAwarded > 0)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppTheme.emeraldGreen.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppTheme.emeraldGreen.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: AppTheme.emeraldGreen, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    response.message,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.emeraldGreen,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
              ],
            ),
          ),
        ...List.generate(results.length, (i) {
          final isUserVote = i == userVoteIdx;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        results[i].option,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              fontWeight: isUserVote ? FontWeight.bold : FontWeight.normal,
                              color: isUserVote ? AppTheme.goldYellow : Colors.white,
                            ),
                      ),
                    ),
                    if (isUserVote)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        margin: const EdgeInsets.only(right: 8),
                        decoration: BoxDecoration(
                          color: AppTheme.goldYellow.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          'YOU',
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: AppTheme.goldYellow,
                                fontWeight: FontWeight.bold,
                                fontSize: 9,
                              ),
                        ),
                      ),
                    Text(
                      '${results[i].percentage}%',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Stack(
                    children: [
                      Container(
                        height: 12,
                        decoration: BoxDecoration(
                          color: const Color(0x1AFFFFFF),
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      FractionallySizedBox(
                        widthFactor: results[i].percentage / 100.0,
                        child: Container(
                          height: 12,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            gradient: isUserVote
                                ? const LinearGradient(
                                    colors: [AppTheme.goldYellow, Color(0xFFFF6B35)],
                                  )
                                : LinearGradient(
                                    colors: [
                                      Colors.white.withValues(alpha: 0.4),
                                      Colors.white.withValues(alpha: 0.2),
                                    ],
                                  ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${results[i].count} vote${results[i].count == 1 ? '' : 's'}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.greyMedium,
                      ),
                ),
              ],
            ),
          );
        }),
        const SizedBox(height: 16),
        Center(
          child: Text(
            '$totalVotes total vote${totalVotes == 1 ? '' : 's'}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.greyMedium,
                ),
          ),
        ),
      ],
    );
  }

  void _submitVote(String pollId, int selectedOption) {
    ref.read(pollVoteProvider.notifier).vote(
          pollId: pollId,
          selectedOption: selectedOption,
        );
    setState(() => _voted = true);
  }

  String _formatDate(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}';
  }
}
