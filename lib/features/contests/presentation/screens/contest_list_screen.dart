import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/contest_model.dart';
import '../providers/contest_provider.dart';
import '../widgets/contest_card.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class ContestListScreen extends ConsumerStatefulWidget {
  const ContestListScreen({super.key});

  @override
  ConsumerState<ContestListScreen> createState() => _ContestListScreenState();
}

class _ContestListScreenState extends ConsumerState<ContestListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final contestsAsync = ref.watch(contestListProvider);

    return Column(
      children: [
        _buildTabBar(),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildTabContent(contestsAsync),
              _buildTabContent(contestsAsync),
              _buildTabContent(contestsAsync),
              _buildTabContent(contestsAsync),
              _buildTabContent(contestsAsync),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.secondarySlate,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: TabBar(
        controller: _tabController,
        dividerColor: Colors.transparent,
        indicatorPadding: const EdgeInsets.symmetric(
          horizontal: -20,
          vertical: 6,
        ),
        indicator: BoxDecoration(
          color: AppTheme.primaryRed.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.primaryRed.withValues(alpha: 0.3)),
        ),

        // indicatorPadding: EdgeInsetsGeometry.all(5),
        labelColor: AppTheme.white,
        unselectedLabelColor: AppTheme.greyMedium,
        labelStyle: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
        ),
        unselectedLabelStyle: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          letterSpacing: 0.3,
        ),
        tabs: const [
          Tab(text: 'All'),
          Tab(text: 'Active'),
          Tab(text: 'Mega'),
          Tab(text: 'Home'),
          Tab(text: 'Past'),
        ],
      ),
    );
  }

  List<ContestModel> _filteredContests(List<ContestModel> contests) {
    switch (_tabController.index) {
      case 1:
        return contests.where((c) => c.status == 'running').toList();
      case 2:
        return contests.where((c) => c.type == 'mega').toList();
      case 3:
        return contests.where((c) => c.type == 'home').toList();
      case 4:
        return contests.where((c) => c.status == 'completed').toList();
      default:
        return contests;
    }
  }

  Color? _accentColorForTab() {
    switch (_tabController.index) {
      case 2:
        return AppTheme.goldYellow;
      case 3:
        return AppTheme.emeraldGreen;
      default:
        return null;
    }
  }

  Widget? _titleIconForTab() {
    switch (_tabController.index) {
      case 2:
        return const Icon(Icons.star, color: AppTheme.goldYellow, size: 20);
      case 3:
        return const Icon(Icons.home, color: AppTheme.emeraldGreen, size: 20);
      default:
        return null;
    }
  }

  Widget _buildTabContent(AsyncValue<List<ContestModel>> contestsAsync) {
    return contestsAsync.when(
      loading: () => _buildShimmer(),
      error: (error, _) => _buildError(
        error,
        () => ref.read(contestListProvider.notifier).fetchContests(),
      ),
      data: (contests) {
        final filtered = _filteredContests(contests);
        if (filtered.isEmpty) {
          return _buildEmpty();
        }
        final accentColor = _accentColorForTab();
        final titleIcon = _titleIconForTab();
        return RefreshIndicator(
          onRefresh: () =>
              ref.read(contestListProvider.notifier).fetchContests(),
          child: ListView.builder(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            itemCount: filtered.length,
            itemBuilder: (context, index) {
              final contest = filtered[index];
                final joined = ref.read(contestListProvider.notifier).isJoined(contest.id);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: ContestCard(
                    contest: contest,
                    accentColor: accentColor,
                    titleIcon: titleIcon,
                    isJoined: joined,
                    onJoin: () => context.push('/contest/${contest.id}'),
                  ),
                );
            },
          ),
        );
      },
    );
  }

  Widget _buildShimmer() {
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 5,
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        return ShimmerCard(
          height: 160,
          margin: const EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerLine(width: 180, height: 20),
                const SizedBox(height: 12),
                ShimmerLine(width: 120, height: 14),
                const SizedBox(height: 8),
                ShimmerLine(width: double.infinity, height: 14),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    ShimmerLine(width: 80, height: 32, borderRadius: 16),
                    ShimmerLine(width: 60, height: 14),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildError(Object error, VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: AppTheme.greyMedium),
            const SizedBox(height: 16),
            Text(
              'Something went wrong',
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              error.toString(),
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    final messages = {
      0: 'No contests available right now',
      1: 'No active contests',
      2: 'No mega contests',
      3: 'No home contests',
      4: 'No past contests',
    };

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.emoji_events_outlined,
            size: 64,
            color: AppTheme.greyMedium,
          ),
          const SizedBox(height: 16),
          Text(
            'No contests found',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            messages[_tabController.index] ?? 'No contests available right now',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}
