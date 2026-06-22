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
    _tabController = TabController(length: 3, vsync: this);
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
        _buildHeader(),
        _buildTabBar(),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildTabContent(contestsAsync),
              _buildTabContent(contestsAsync),
              _buildTabContent(contestsAsync),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          Text(
            'Contests',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return TabBar(
      controller: _tabController,
      labelColor: AppTheme.white,
      unselectedLabelColor: AppTheme.greyMedium,
      indicatorColor: AppTheme.primaryRed,
      indicatorWeight: 3,
      tabs: const [
        Tab(text: 'All'),
        Tab(text: 'Active'),
        Tab(text: 'Completed'),
      ],
    );
  }

  List<ContestModel> _filteredContests(List<ContestModel> contests) {
    switch (_tabController.index) {
      case 1:
        return contests.where((c) => c.status == 'running').toList();
      case 2:
        return contests.where((c) => c.status == 'completed').toList();
      default:
        return contests;
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
        return RefreshIndicator(
          onRefresh: () => ref.read(contestListProvider.notifier).fetchContests(),
          child: ListView.builder(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            itemCount: filtered.length,
            itemBuilder: (context, index) {
              final contest = filtered[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: ContestCard(
                  contest: contest,
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
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.emoji_events_outlined, size: 64, color: AppTheme.greyMedium),
          const SizedBox(height: 16),
          Text(
            'No contests found',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Text(
            _tabController.index == 0
                ? 'No contests available right now'
                : _tabController.index == 1
                    ? 'No active contests'
                    : 'No completed contests',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}
