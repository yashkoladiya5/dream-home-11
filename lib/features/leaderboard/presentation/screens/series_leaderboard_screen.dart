import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../../../contests/presentation/providers/contest_provider.dart';
import '../providers/leaderboard_provider.dart';
import '../widgets/leaderboard_user_tile.dart';
import '../../data/models/leaderboard_models.dart';

class SeriesLeaderboardScreen extends ConsumerStatefulWidget {
  const SeriesLeaderboardScreen({super.key});

  @override
  ConsumerState<SeriesLeaderboardScreen> createState() => _SeriesLeaderboardScreenState();
}

class _SeriesLeaderboardScreenState extends ConsumerState<SeriesLeaderboardScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  bool _showSearch = false;

  static const _tabs = [LeaderboardCycle.allTime, LeaderboardCycle.weekly, LeaderboardCycle.monthly, LeaderboardCycle.custom];
  static const _tabLabels = ['All Time', 'Weekly', 'Monthly', 'Events'];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      final notifier = ref.read(leaderboardProvider.notifier);
      if (notifier.hasMore && !notifier.isLoadingMore) {
        notifier.loadNextPage();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final lbAsync = ref.watch(leaderboardProvider);
    final notifier = ref.read(leaderboardProvider.notifier);
    final activeCycle = notifier.currentCycle;
    final activeIndex = _tabs.indexOf(activeCycle);
    final selectedContestId = notifier.selectedContestId;
    final isEventsTab = activeCycle == LeaderboardCycle.custom;
    final hasContest = isEventsTab && selectedContestId != null;
    final showSearchIcon = !isEventsTab || hasContest;

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: _showSearch
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Search by name or phone...',
                  hintStyle: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.7)),
                  border: InputBorder.none,
                  filled: true,
                  fillColor: AppTheme.secondarySlate,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, color: AppTheme.greyMedium, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            ref.read(leaderboardProvider.notifier).refresh();
                          },
                        )
                      : null,
                ),
                onChanged: (value) {
                  setState(() {});
                  ref.read(leaderboardProvider.notifier).search(value);
                },
              )
            : AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Text(
                  isEventsTab && selectedContestId != null ? 'Event Leaderboard' : 'Leaderboard',
                  key: ValueKey(isEventsTab && selectedContestId != null ? 'event' : 'global'),
                ),
              ),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
        actions: [
          if (showSearchIcon)
            IconButton(
              icon: Icon(_showSearch ? Icons.close_rounded : Icons.search_rounded),
              onPressed: () {
                setState(() {
                  _showSearch = !_showSearch;
                  if (!_showSearch) {
                    _searchController.clear();
                    ref.read(leaderboardProvider.notifier).refresh();
                  }
                });
              },
            ),
        ],
      ),
      body: Column(
        children: [
          _buildTabBar(theme, activeIndex),
          AnimatedSize(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            child: isEventsTab ? _buildContestPicker(theme) : const SizedBox.shrink(),
          ),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              switchInCurve: Curves.easeIn,
              switchOutCurve: Curves.easeOut,
              child: _buildContent(theme, lbAsync, activeCycle, selectedContestId, isEventsTab),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(ThemeData theme, AsyncValue<LeaderboardResponse> lbAsync, LeaderboardCycle activeCycle, String? selectedContestId, bool isEventsTab) {
    if (isEventsTab && selectedContestId == null) {
      return _buildNoContestSelected(theme);
    }

    return RefreshIndicator(
      key: ValueKey('${activeCycle.name}_${selectedContestId ?? ''}'),
      onRefresh: () => ref.read(leaderboardProvider.notifier).refresh(),
      child: lbAsync.when(
        data: (response) {
          final notif = ref.read(leaderboardProvider.notifier);
          if (response.entries.isEmpty && !notif.isSearching) {
            return _buildEmptyLeaderboard(theme);
          }
          return CustomScrollView(
            controller: _scrollController,
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              if (response.userRank != null && !notif.isSearching)
                SliverToBoxAdapter(
                  child: _buildUserRankCard(theme, response.userRank!, response.totalCount, activeCycle),
                ),
              SliverToBoxAdapter(child: const SizedBox(height: 12)),
              if (!notif.isSearching && response.entries.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        Text(
                          'Top Players',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryRed.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${response.totalCount} players',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: AppTheme.greyMedium,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              SliverToBoxAdapter(child: const SizedBox(height: 12)),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final entry = response.entries[index];
                      final isCurrentUser = response.userRank?.userId == entry.userId;
                      return LeaderboardUserTile(
                        entry: entry,
                        isCurrentUser: isCurrentUser,
                      );
                    },
                    childCount: response.entries.length,
                  ),
                ),
              ),
              if (notif.hasMore)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Center(
                      child: notif.isLoadingMore
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppTheme.primaryRed,
                              ),
                            )
                          : TextButton.icon(
                              onPressed: () => notif.loadNextPage(),
                              icon: const Icon(Icons.expand_more_rounded, size: 18),
                              label: const Text('Load More'),
                              style: TextButton.styleFrom(foregroundColor: AppTheme.primaryRed),
                            ),
                    ),
                  ),
                ),
              SliverToBoxAdapter(child: const SizedBox(height: 32)),
            ],
          );
        },
        loading: () => _buildLoadingShimmer(),
        error: (e, s) => _buildError(e),
      ),
    );
  }

  Widget _buildTabBar(ThemeData theme, int activeIndex) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.secondarySlate,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: List.generate(_tabs.length, (i) {
            final isSelected = i == activeIndex;
            return Expanded(
              child: GestureDetector(
                onTap: () => ref.read(leaderboardProvider.notifier).setCycle(_tabs[i]),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.primaryRed : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 200),
                    style: (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
                      color: isSelected ? Colors.white : AppTheme.greyMedium,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                    child: Text(
                      _tabLabels[i],
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget _buildContestPicker(ThemeData theme) {
    final contestsAsync = ref.watch(contestListProvider);
    final selectedId = ref.read(leaderboardProvider.notifier).selectedContestId;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      child: contestsAsync.when(
        data: (contests) {
          final running = contests.where((c) => c.status == 'running').toList();
          if (running.isEmpty) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'No running contests available',
                style: TextStyle(color: AppTheme.greyMedium, fontSize: 13),
              ),
            );
          }
          return SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: running.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final contest = running[index];
                final isSelected = contest.id == selectedId;
                return GestureDetector(
                  onTap: () => ref.read(leaderboardProvider.notifier).setContest(contest.id),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppTheme.primaryRed : AppTheme.secondarySlate,
                      borderRadius: BorderRadius.circular(18),
                      border: isSelected ? null : Border.all(color: const Color(0x1FFFFFFF)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isSelected)
                          Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: Icon(Icons.check_rounded, size: 14, color: Colors.white),
                          ),
                        Text(
                          contest.title,
                          style: TextStyle(
                            color: isSelected ? Colors.white : AppTheme.greyMedium,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
        loading: () => const SizedBox(
          height: 38,
          child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))),
        ),
        error: (_, _) => const SizedBox(height: 38),
      ),
    );
  }

  Widget _buildNoContestSelected(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.primaryRed.withValues(alpha: 0.1),
            ),
            child: Icon(Icons.emoji_events_rounded, color: AppTheme.primaryRed.withValues(alpha: 0.5), size: 40),
          ),
          const SizedBox(height: 20),
          Text(
            'Select a Contest',
            style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Choose a running contest above\nto view its series leaderboard',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyLeaderboard(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.greyMedium.withValues(alpha: 0.1),
            ),
            child: Icon(Icons.leaderboard_rounded, color: AppTheme.greyMedium.withValues(alpha: 0.5), size: 40),
          ),
          const SizedBox(height: 20),
          Text(
            'No players yet',
            style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Players will appear here once\nthey earn points in this cycle',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium, height: 1.5),
          ),
        ],
      ),
    );
  }

  Widget _buildUserRankCard(ThemeData theme, LeaderboardEntry userEntry, int totalCount, LeaderboardCycle cycle) {
    final cycleLabel = cycle == LeaderboardCycle.weekly ? 'this week' :
                       cycle == LeaderboardCycle.monthly ? 'this month' :
                       cycle == LeaderboardCycle.custom ? 'this event' : 'all time';
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: AppTheme.primaryGradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primaryRed.withValues(alpha: 0.3),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('Your Rank', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
                const Spacer(),
                Text(
                  '$cycleLabel \u2022 $totalCount players',
                  style: const TextStyle(color: Colors.white60, fontSize: 11),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.15),
                  ),
                  child: Center(
                    child: Text(
                      '#${userEntry.rank}',
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        userEntry.fullName ?? 'You',
                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${userEntry.score.toInt()} pts',
                        style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingShimmer() {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const ShimmerCard(height: 42, borderRadius: 12),
          const SizedBox(height: 12),
          const ShimmerCard(height: 100, borderRadius: 16),
          const SizedBox(height: 16),
          const ShimmerLine(width: 120, height: 18),
          const SizedBox(height: 12),
          ...List.generate(8, (i) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: ShimmerCard(height: 66, borderRadius: 14),
          )),
        ],
      ),
    );
  }

  Widget _buildError(Object e) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.primaryRed.withValues(alpha: 0.1),
              ),
              child: Icon(Icons.leaderboard_rounded, color: AppTheme.primaryRed.withValues(alpha: 0.5), size: 40),
            ),
            const SizedBox(height: 20),
            Text(
              'Failed to load leaderboard',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.greyMedium),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(leaderboardProvider.notifier).refresh(),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryRed,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Retry', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
