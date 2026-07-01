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
  bool _showFilters = false;
  bool _sortAsc = true;
  String _sortBy = 'entryFee';
  String? _selectedType;
  String? _selectedStatus;
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  final _typeFilters = ['All', 'Mega', 'Head to Head', 'League'];
  final _statusFilters = ['Upcoming', 'Live', 'Completed'];
  final _sortOptions = [
    {'label': 'Entry Fee', 'value': 'entryFee'},
    {'label': 'Prize Pool', 'value': 'prizePool'},
    {'label': 'Start Time', 'value': 'startTime'},
  ];

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
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final contestsAsync = ref.watch(contestListProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: Container(
        height: 56,
        width: 56,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            colors: [AppTheme.primaryRed, Color(0xFF9E1B1B)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primaryRed.withValues(alpha: 0.4),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: FloatingActionButton(
          onPressed: _showPremiumSheet,
          backgroundColor: Colors.transparent,
          elevation: 0,
          shape: const CircleBorder(),
          child: const Icon(Icons.add_rounded, color: AppTheme.white, size: 28),
        ),
      ),
      body: Column(
        children: [
          _buildTabBar(),
          if (_showFilters) _buildFilterBar(),
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
      ),
    );
  }

  void _showPremiumSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.6),
      builder: (_) => _PremiumActionSheet(
        onCreatePrivate: () {
          Navigator.of(context).pop();
          context.push('/create-contest');
        },
        onJoinWithCode: () {
          Navigator.of(context).pop();
          context.push('/enter-code');
        },
        onMyActiveContests: () {
          Navigator.of(context).pop();
          context.pop();
        },
      ),
    );
  }

  Widget _buildTabBar() {
    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 8),
      child: Row(
        children: [
          Expanded(
            child: Container(
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
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: _showFilters ? AppTheme.primaryRed : AppTheme.secondarySlate,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _showFilters
                    ? AppTheme.primaryRed
                    : Colors.white.withValues(alpha: 0.06),
              ),
            ),
            child: IconButton(
              onPressed: () => setState(() => _showFilters = !_showFilters),
              icon: Icon(
                Icons.filter_list_rounded,
                color: _showFilters ? AppTheme.white : AppTheme.greyMedium,
                size: 20,
              ),
              padding: EdgeInsets.zero,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          _buildSearchField(),
          const SizedBox(height: 12),
          _buildFilterChips(),
          const SizedBox(height: 12),
          _buildSortRow(),
        ],
      ),
    );
  }

  Widget _buildSearchField() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.secondarySlate,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: TextField(
        controller: _searchController,
        focusNode: _searchFocusNode,
        style: const TextStyle(color: AppTheme.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: 'Search contests...',
          hintStyle: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.7), fontSize: 14),
          prefixIcon: Icon(Icons.search_rounded, color: AppTheme.greyMedium, size: 20),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  onPressed: () {
                    _searchController.clear();
                    setState(() {});
                  },
                  icon: Icon(Icons.close_rounded, color: AppTheme.greyMedium, size: 18),
                )
              : null,
          border: InputBorder.none,
          filled: false,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
        onChanged: (_) => setState(() {}),
      ),
    );
  }

  Widget _buildFilterChips() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 34,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              ..._typeFilters.map((type) => _buildChip(
                type,
                selected: type == 'All' ? _selectedType == null : _selectedType == type.toLowerCase(),
                onTap: () {
                  setState(() {
                    _selectedType = type == 'All' ? null : type.toLowerCase();
                    _selectedStatus = null;
                  });
                },
              )),
              const SizedBox(width: 8),
              Container(width: 1, height: 20, color: Colors.white.withValues(alpha: 0.08)),
              const SizedBox(width: 8),
              ..._statusFilters.map((status) => _buildChip(
                status,
                selected: _selectedStatus == status.toLowerCase(),
                onTap: () {
                  setState(() {
                    _selectedStatus = _selectedStatus == status.toLowerCase() ? null : status.toLowerCase();
                    _selectedType = null;
                  });
                },
              )),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildChip(String label, {required bool selected, required VoidCallback onTap}) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: selected ? AppTheme.primaryRed : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? AppTheme.primaryRed : Colors.white.withValues(alpha: 0.12),
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: selected ? AppTheme.white : AppTheme.greyMedium,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSortRow() {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          decoration: BoxDecoration(
            color: AppTheme.secondarySlate,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _sortBy,
              dropdownColor: AppTheme.secondarySlate,
              isDense: true,
              style: const TextStyle(
                color: AppTheme.white,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
              items: _sortOptions.map((opt) {
                return DropdownMenuItem(
                  value: opt['value'],
                  child: Text(opt['label']!, style: const TextStyle(fontSize: 12)),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _sortBy = val);
              },
            ),
          ),
        ),
        const SizedBox(width: 8),
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppTheme.secondarySlate,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
          ),
          child: IconButton(
            onPressed: () => setState(() => _sortAsc = !_sortAsc),
            icon: Icon(
              _sortAsc ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
              color: AppTheme.greyMedium,
              size: 18,
            ),
            padding: EdgeInsets.zero,
          ),
        ),
        const Spacer(),
        Text(
          _searchController.text.isEmpty ? '' : '"${_searchController.text}" ',
          style: const TextStyle(color: AppTheme.greyMedium, fontSize: 11),
        ),
      ],
    );
  }

  List<ContestModel> _filteredContests(List<ContestModel> contests) {
    var result = List<ContestModel>.from(contests);

    // Apply tab filter
    switch (_tabController.index) {
      case 1:
        result = result.where((c) => c.status == 'running').toList();
        break;
      case 2:
        result = result.where((c) => c.type == 'mega').toList();
        break;
      case 3:
        result = result.where((c) => c.type == 'home').toList();
        break;
      case 4:
        result = result.where((c) => c.status == 'completed').toList();
        break;
    }

    // Apply additional filters
    if (_selectedType != null) {
      result = result.where((c) => c.type == _selectedType).toList();
    }
    if (_selectedStatus != null) {
      result = result.where((c) => c.status == _selectedStatus).toList();
    }

    // Apply search
    if (_searchController.text.isNotEmpty) {
      final query = _searchController.text.toLowerCase();
      result = result.where((c) =>
        c.title.toLowerCase().contains(query) ||
        c.type.toLowerCase().contains(query) ||
        c.status.toLowerCase().contains(query)
      ).toList();
    }

    // Apply sort
    result.sort((a, b) {
      int cmp;
      switch (_sortBy) {
        case 'prizePool':
          cmp = (a.prize ?? '').compareTo(b.prize ?? '');
          break;
        case 'startTime':
          cmp = a.startTime.compareTo(b.startTime);
          break;
        case 'entryFee':
        default:
          cmp = a.entryFeeInr.compareTo(b.entryFeeInr);
          break;
      }
      return _sortAsc ? cmp : -cmp;
    });

    return result;
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
            itemExtent: 160,
            cacheExtent: 400,
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
                    onJoin: contest.status == 'completed'
                        ? () => context.push('/contest/${contest.id}/completed')
                        : () => context.push('/contest/${contest.id}'),
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

class _PremiumActionSheet extends StatelessWidget {
  final VoidCallback onCreatePrivate;
  final VoidCallback onJoinWithCode;
  final VoidCallback onMyActiveContests;

  const _PremiumActionSheet({
    required this.onCreatePrivate,
    required this.onJoinWithCode,
    required this.onMyActiveContests,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppTheme.secondarySlate,
            AppTheme.darkSlate,
          ],
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(28),
          topRight: Radius.circular(28),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Private Contests',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                'Create, join, or track your private contests',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.greyMedium,
                      fontSize: 13,
                    ),
              ),
              const SizedBox(height: 24),
              _sheetOption(
                context,
                icon: Icons.add_rounded,
                iconColor: AppTheme.primaryRed,
                title: 'Create Private Contest',
                subtitle: 'Set up your own contest with a custom code',
                onTap: onCreatePrivate,
              ),
              const SizedBox(height: 4),
              _sheetOption(
                context,
                icon: Icons.vpn_key_rounded,
                iconColor: AppTheme.emeraldGreen,
                title: 'Join with Code',
                subtitle: 'Enter an invite code to join a private contest',
                onTap: onJoinWithCode,
              ),
              const SizedBox(height: 4),
              _sheetOption(
                context,
                icon: Icons.sports_esports_rounded,
                iconColor: AppTheme.goldYellow,
                title: 'My Active Contests',
                subtitle: 'View contests you have joined and track progress',
                onTap: onMyActiveContests,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sheetOption(
    BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    iconColor.withValues(alpha: 0.2),
                    iconColor.withValues(alpha: 0.05),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: iconColor.withValues(alpha: 0.2)),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppTheme.white,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppTheme.greyMedium,
                          fontSize: 12,
                        ),
                  ),
                ],
              ),
            ),
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.chevron_right_rounded,
                color: AppTheme.greyMedium.withValues(alpha: 0.6),
                size: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
