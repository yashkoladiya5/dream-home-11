import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/completed_contest_data.dart';
import '../../data/models/completed_member_entry.dart';
import '../providers/contest_provider.dart';

class CompletedContestScreen extends ConsumerStatefulWidget {
  final String contestId;

  const CompletedContestScreen({super.key, required this.contestId});

  @override
  ConsumerState<CompletedContestScreen> createState() =>
      _CompletedContestScreenState();
}

class _CompletedContestScreenState extends ConsumerState<CompletedContestScreen>
    with SingleTickerProviderStateMixin {
  CompletedContestData? _data;
  bool _isLoading = true;
  String? _error;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _stagger1;
  late Animation<double> _stagger2;
  late Animation<double> _stagger3;

  static const _avatarColors = [
    Color(0xFFD22C2C),
    Color(0xFF10B981),
    Color(0xFFF59E0B),
    Color(0xFF8B5CF6),
    Color(0xFF06B6D4),
    Color(0xFFF97316),
    Color(0xFFEC4899),
    Color(0xFF14B8A6),
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
    );
    _stagger1 = CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.1, 0.6, curve: Curves.easeOut),
    );
    _stagger2 = CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.3, 0.8, curve: Curves.easeOut),
    );
    _stagger3 = CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.5, 1.0, curve: Curves.easeOut),
    );
    _loadData();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  String _formatDate(DateTime date) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  String _rankEmoji(int rank) {
    switch (rank) {
      case 1:
        return '\u{1F947}';
      case 2:
        return '\u{1F948}';
      case 3:
        return '\u{1F949}';
      default:
        return '';
    }
  }

  Color _avatarColor(int index) {
    return _avatarColors[index % _avatarColors.length];
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await ref
          .read(contestListProvider.notifier)
          .fetchCompletedContest(widget.contestId);
      if (mounted) {
        if (data == null) {
          setState(() {
            _error = 'Failed to load completed contest data';
            _isLoading = false;
          });
        } else {
          setState(() {
            _data = data;
            _isLoading = false;
          });
          _animationController.forward();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(backgroundColor: AppTheme.darkSlate, body: _buildBody());
  }

  Widget _buildBody() {
    if (_isLoading) return _buildLoading();
    if (_error != null) return _buildError();
    if (_data == null) return _buildError();
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
            Icon(
              Icons.error_outline_rounded,
              size: 64,
              color: AppTheme.greyMedium,
            ),
            const SizedBox(height: 16),
            Text(
              _error ?? 'Contest data not found',
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
        child: Column(
          children: [
            _buildHeroHeader(),
            FadeTransition(
              opacity: _fadeAnimation,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 28),
                    _buildPodiumSection(),
                    const SizedBox(height: 28),
                    _buildStatsRow(),
                    const SizedBox(height: 28),
                    _buildPointDistribution(),
                    const SizedBox(height: 28),
                    _buildFinalRankings(),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroHeader() {
    final contest = _data!.contest;
    final topPadding = MediaQuery.of(context).padding.top;
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryRed,
            AppTheme.primaryRed.withValues(alpha: 0.85),
            AppTheme.primaryRed.withValues(alpha: 0.5),
            AppTheme.darkSlate,
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          stops: const [0.0, 0.3, 0.7, 1.0],
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(36),
          bottomRight: Radius.circular(36),
        ),
      ),
      padding: EdgeInsets.fromLTRB(20, topPadding + 12, 20, 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(
                    Icons.arrow_back_rounded,
                    color: Colors.white,
                  ),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.emoji_events_rounded,
                  color: AppTheme.goldYellow,
                  size: 26,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            contest.title,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          if (contest.prize != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppTheme.goldYellow.withValues(alpha: 0.25),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.monetization_on_rounded,
                    color: AppTheme.goldYellow,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    contest.prize!,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppTheme.goldYellow,
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 20),
          Row(
            children: [
              _buildCompletedBadge(),
              const SizedBox(width: 12),
              Icon(
                Icons.access_time_rounded,
                size: 14,
                color: Colors.white.withValues(alpha: 0.5),
              ),
              const SizedBox(width: 6),
              Text(
                'Ended ${_formatDate(contest.endTime)}',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5),
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCompletedBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.emeraldGreen.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(
              color: AppTheme.emeraldGreen,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.emeraldGreen.withValues(alpha: 0.5),
                  blurRadius: 4,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'COMPLETED',
            style: TextStyle(
              color: AppTheme.emeraldGreen,
              fontSize: 11,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPodiumSection() {
    final members = _data!.members;
    if (members.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 20),
          child: Row(
            children: [
              const Icon(
                Icons.emoji_events_rounded,
                color: AppTheme.goldYellow,
                size: 22,
              ),
              const SizedBox(width: 10),
              Text(
                'Champions',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (members.length >= 2)
              Expanded(child: _buildPodiumCard(members[1], 2)),
            if (members.length >= 2) const SizedBox(width: 8),
            if (members.length >= 1)
              Expanded(child: _buildPodiumCard(members[0], 1)),
            if (members.length >= 1) const SizedBox(width: 8),
            if (members.length >= 3)
              Expanded(child: _buildPodiumCard(members[2], 3)),
          ],
        ),
      ],
    );
  }

  Widget _buildPodiumCard(CompletedMemberEntry member, int rank) {
    final heights = <int, double>{1: 175, 2: 155, 3: 155};
    final avatarRadius = rank == 1 ? 24.0 : 18.0;
    final emojiSize = rank == 1 ? 26.0 : 22.0;

    return SizedBox(
      height: heights[rank]!,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(8, 14, 8, 12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: rank == 1
                ? AppTheme.goldYellow.withValues(alpha: 0.25)
                : Colors.white.withValues(alpha: 0.06),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            Text(_rankEmoji(rank), style: TextStyle(fontSize: emojiSize)),
            const SizedBox(height: 8),
            CircleAvatar(
              radius: avatarRadius,
              backgroundColor: _avatarColor(rank - 1),
              child: Text(
                member.userName.isNotEmpty
                    ? member.userName[0].toUpperCase()
                    : '?',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: rank == 1 ? 20 : 15,
                ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              member.userName,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
                fontSize: 11,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              '${member.points} pts',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: rank == 1 ? AppTheme.goldYellow : AppTheme.greyLight,
                fontWeight: FontWeight.bold,
                fontSize: rank == 1 ? 15 : 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsRow() {
    final stats = _data!.stats;
    return FadeTransition(
      opacity: _stagger1,
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              Icons.people_rounded,
              'Players',
              '${stats.totalParticipants}',
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              Icons.stars_rounded,
              'Total Pts',
              '${stats.totalPointsAwarded}',
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              Icons.trending_up_rounded,
              'Avg Pts',
              '${stats.averagePoints}',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B).withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppTheme.greyMedium, size: 22),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontSize: 11,
              color: AppTheme.greyMedium,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPointDistribution() {
    final members = _data!.members;
    final maxPoints = members.fold<int>(
      0,
      (max, m) => m.points > max ? m.points : max,
    );
    final topMembers = members.take(5).toList();
    final effectiveMax = maxPoints > 0 ? maxPoints : 1;

    return FadeTransition(
      opacity: _stagger2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 16),
            child: Row(
              children: [
                const Icon(
                  Icons.bar_chart_rounded,
                  color: AppTheme.primaryRed,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Text(
                  'Point Distribution',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          LayoutBuilder(
            builder: (context, constraints) {
              final availableWidth = constraints.maxWidth - 90;
              return Column(
                children: topMembers.map((member) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: AnimatedBuilder(
                      animation: _animationController,
                      builder: (context, child) {
                        final barProgress = _animationController.value;
                        final barWidth =
                            barProgress *
                            (member.points / effectiveMax) *
                            availableWidth;
                        return _buildBarRow(member, barWidth);
                      },
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildBarRow(CompletedMemberEntry member, double barWidth) {
    return Row(
      children: [
        SizedBox(
          width: 28,
          child: Text(
            '#${member.rank}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 11,
              color: AppTheme.greyMedium,
            ),
          ),
        ),
        const SizedBox(width: 8),
        CircleAvatar(
          radius: 12,
          backgroundColor: _avatarColor(member.rank - 1).withValues(alpha: 0.3),
          child: Text(
            member.userName.isNotEmpty ? member.userName[0].toUpperCase() : '?',
            style: TextStyle(
              color: _avatarColor(member.rank - 1),
              fontWeight: FontWeight.bold,
              fontSize: 11,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Container(
              height: 22,
              width: max(barWidth, 0),
              color: AppTheme.primaryRed,
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 46,
          child: Text(
            '${member.points}',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }

  Widget _buildFinalRankings() {
    final members = _data!.members;
    return FadeTransition(
      opacity: _stagger3,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 16),
            child: Row(
              children: [
                const Icon(
                  Icons.leaderboard_rounded,
                  color: AppTheme.primaryRed,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Text(
                  'Final Rankings',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${members.length}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.greyMedium,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.only(left: 14),
            child: Column(
              children: members.asMap().entries.map((entry) {
                return _buildRankingRow(entry.value, entry.key);
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRankingRow(CompletedMemberEntry member, int index) {
    final isTop3 = member.rank <= 3;
    final isLast = index == _data!.members.length - 1;
    final emoji = _rankEmoji(member.rank);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 24,
                  height: isTop3 ? 28 : 24,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isTop3
                        ? AppTheme.goldYellow.withValues(alpha: 0.15)
                        : Colors.white.withValues(alpha: 0.05),
                    border: Border.all(
                      color: isTop3
                          ? AppTheme.goldYellow.withValues(alpha: 0.3)
                          : Colors.white.withValues(alpha: 0.08),
                      width: 1.5,
                    ),
                  ),
                  child: emoji.isNotEmpty
                      ? Text(emoji, style: const TextStyle(fontSize: 13))
                      : Text(
                          '${member.rank}',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                                color: AppTheme.greyMedium,
                              ),
                        ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 1.5,
                      color: Colors.white.withValues(alpha: 0.06),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: 4),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: isTop3
                    ? AppTheme.goldYellow.withValues(alpha: 0.04)
                    : Colors.white.withValues(alpha: 0.02),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isTop3
                      ? AppTheme.goldYellow.withValues(alpha: 0.1)
                      : Colors.white.withValues(alpha: 0.04),
                ),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: _avatarColor(member.rank - 1),
                    child: Text(
                      member.userName.isNotEmpty
                          ? member.userName[0].toUpperCase()
                          : '?',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      member.userName,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontSize: 14,
                        fontWeight: isTop3
                            ? FontWeight.w600
                            : FontWeight.normal,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: isTop3
                          ? AppTheme.goldYellow.withValues(alpha: 0.1)
                          : Colors.white.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${member.points} pts',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: isTop3
                            ? AppTheme.goldYellow
                            : AppTheme.greyLight,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
