import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import '../../data/models/contest_model.dart';
import '../../data/models/activity_event.dart';
import '../../data/models/leaderboard_entry.dart';
import '../../data/services/contest_socket_service.dart';
import '../providers/contest_provider.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class ContestRunningScreen extends ConsumerStatefulWidget {
  final String contestId;

  const ContestRunningScreen({super.key, required this.contestId});

  @override
  ConsumerState<ContestRunningScreen> createState() => _ContestRunningScreenState();
}

class _ContestRunningScreenState extends ConsumerState<ContestRunningScreen> {
  ContestModel? _contest;
  List<LeaderboardEntry> _leaderboard = [];
  List<ActivityEvent> _activities = [];
  Duration _remaining = Duration.zero;
  Timer? _timer;
  bool _isLoading = true;
  String? _error;
  StreamSubscription<ActivityEvent>? _activitySub;
  StreamSubscription<List<LeaderboardEntry>>? _leaderboardSub;
  final ContestSocketService _socketService = ContestSocketService();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _activitySub?.cancel();
    _leaderboardSub?.cancel();
    _socketService.dispose();
    super.dispose();
  }

  void _connectSocket() {
    final authState = ref.read(authProvider);
    final token = authState.sessionToken;
    if (token != null) {
      _socketService.connect(token, widget.contestId);
      _activitySub = _socketService.onActivity.listen((event) {
        if (mounted) {
          setState(() => _activities.insert(0, event));
        }
      });
      _leaderboardSub = _socketService.onLeaderboardUpdate.listen((entries) {
        if (mounted) {
          setState(() => _leaderboard = entries);
        }
      });
    }
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final contest = ref.read(contestListProvider.notifier).getContestById(widget.contestId);

      if (contest == null) {
        setState(() {
          _error = 'Contest not found';
          _isLoading = false;
        });
        return;
      }

      _updateRemaining(contest);
      _startTimer();

      setState(() {
        _contest = contest;
        _activities = [];
      });

      final lb = await ref.read(contestListProvider.notifier).fetchLeaderboard(widget.contestId);
      if (mounted) {
        setState(() {
          _leaderboard = lb;
          _isLoading = false;
        });
      }

      _connectSocket();
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _updateRemaining(ContestModel contest) {
    final diff = contest.endTime.difference(DateTime.now());
    _remaining = diff.isNegative ? Duration.zero : diff;
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_contest != null && mounted) {
        _updateRemaining(_contest!);
        setState(() {});
      }
    });
  }

  String _timeAgo(DateTime d) {
    final diff = DateTime.now().difference(d);
    if (diff.inSeconds < 60) return '${diff.inSeconds}s';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }

  String _formatDuration(Duration d) {
    final days = d.inDays.toString().padLeft(2, '0');
    final hours = (d.inHours % 24).toString().padLeft(2, '0');
    final minutes = (d.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$days:$hours:$minutes:$seconds';
  }

  Color _activityIconColor(String type) {
    switch (type) {
      case 'contest_joined':
        return AppTheme.emeraldGreen;
      case 'points_earned':
        return AppTheme.goldYellow;
      case 'rank_up':
        return AppTheme.emeraldGreen;
      case 'bonus':
        return const Color(0xFF8B5CF6);
      case 'milestone':
        return AppTheme.goldYellow;
      default:
        return AppTheme.greyMedium;
    }
  }

  IconData _activityIcon(String type) {
    switch (type) {
      case 'contest_joined':
        return Icons.emoji_events_rounded;
      case 'points_earned':
        return Icons.stars_rounded;
      case 'rank_up':
        return Icons.trending_up_rounded;
      case 'bonus':
        return Icons.card_giftcard_rounded;
      case 'milestone':
        return Icons.flag_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_contest?.title ?? 'Contest'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return _buildLoading();
    if (_error != null) return _buildError();
    if (_contest == null) return _buildError();
    return _buildContent();
  }

  Widget _buildLoading() {
    return const Center(
      child: CircularProgressIndicator(color: AppTheme.primaryRed),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline_rounded, size: 64, color: AppTheme.greyMedium),
            const SizedBox(height: 16),
            Text(
              _error ?? 'Contest not found',
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _loadData,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildContestHeaderCard(),
            const SizedBox(height: 16),
            _buildCountdownCard(),
            const SizedBox(height: 16),
            _buildStatsRow(),
            const SizedBox(height: 24),
            _buildActivityFeed(),
            const SizedBox(height: 24),
            _buildLeaderboardPreview(),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildContestHeaderCard() {
    final contest = _contest!;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  contest.title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
              _buildLiveBadge(),
            ],
          ),
          if (contest.prize != null) ...[
            const SizedBox(height: 8),
            Text(
              contest.prize!,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: AppTheme.goldYellow,
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLiveBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.emeraldGreen.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: AppTheme.emeraldGreen,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            'LIVE',
            style: TextStyle(
              color: AppTheme.emeraldGreen,
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.0,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCountdownCard() {
    final isEnded = _remaining == Duration.zero;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.timer_rounded, color: isEnded ? AppTheme.greyMedium : AppTheme.goldYellow, size: 24),
              const SizedBox(width: 8),
              Text(
                _formatDuration(_remaining),
                style: Theme.of(context).textTheme.displayMedium?.copyWith(
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.bold,
                      color: isEnded ? AppTheme.greyMedium : AppTheme.white,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            isEnded ? 'ENDED' : 'until contest ends',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: isEnded ? AppTheme.greyMedium : AppTheme.greyLight,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow() {
    final contest = _contest!;
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            icon: Icons.show_chart_rounded,
            label: 'My Rank',
            value: '#${contest.myRank ?? '-'} of ${contest.maxSlots}',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            icon: Icons.stars_rounded,
            label: 'Points',
            value: '${contest.myPoints ?? 0} PTS',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            icon: Icons.people_rounded,
            label: 'Slots',
            value: '${contest.filledSlots}/${contest.maxSlots}',
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppTheme.greyMedium, size: 22),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontSize: 11,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildActivityFeed() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Row(
            children: [
              Text(
                'Activity Feed',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.greyDark,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_activities.length}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
            ],
          ),
        ),
        if (_activities.isEmpty)
          _buildActivityEmpty()
        else
          ..._activities.map(_buildActivityItem),
      ],
    );
  }

  Widget _buildActivityEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Column(
          children: [
            Icon(Icons.notifications_off_rounded, size: 64, color: AppTheme.greyMedium),
            const SizedBox(height: 12),
            Text(
              'No activity yet',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityItem(ActivityEvent event) {
    final color = _activityIconColor(event.type);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: AppTheme.darkCardGradient,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x1FFFFFFF)),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(_activityIcon(event.type), color: color, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.description,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontSize: 14,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _timeAgo(event.timestamp),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontSize: 12,
                        ),
                  ),
                ],
              ),
            ),
            Text(
              '+${event.points} pts',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: event.points > 0 ? AppTheme.goldYellow : AppTheme.greyMedium,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLeaderboardPreview() {
    final top5 = _leaderboard.take(5).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Leaderboard',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              TextButton(
                onPressed: () {},
                child: const Text('View All'),
              ),
            ],
          ),
        ),
        if (top5.isEmpty)
          _buildLeaderboardEmpty()
        else
          ...top5.map(_buildLeaderboardRow),
        const SizedBox(height: 12),
        if (_remaining == Duration.zero)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => context.push('/contest/${widget.contestId}/completed'),
              icon: const Icon(Icons.emoji_events_rounded, size: 18),
              label: const Text('View Final Results'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryRed,
                foregroundColor: AppTheme.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          )
        else
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.white,
                side: const BorderSide(color: AppTheme.greyDark),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('View Full Leaderboard'),
            ),
          ),
      ],
    );
  }

  Widget _buildLeaderboardEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Text(
          'No entries yet',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ),
    );
  }

  Widget _buildLeaderboardRow(LeaderboardEntry entry) {
    Widget rankWidget;
    if (entry.rank == 1) {
      rankWidget = const Text('\u{1F947}', style: TextStyle(fontSize: 20));
    } else if (entry.rank == 2) {
      rankWidget = const Text('\u{1F948}', style: TextStyle(fontSize: 20));
    } else if (entry.rank == 3) {
      rankWidget = const Text('\u{1F949}', style: TextStyle(fontSize: 20));
    } else {
      rankWidget = Container(
        width: 28,
        height: 28,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppTheme.greyDark,
          shape: BoxShape.circle,
        ),
        child: Text(
          '${entry.rank}',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          gradient: AppTheme.darkCardGradient,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x1FFFFFFF)),
        ),
        child: Row(
          children: [
            rankWidget,
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                entry.userName,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontSize: 14,
                    ),
              ),
            ),
            Text(
              '${entry.points} pts',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppTheme.goldYellow,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
