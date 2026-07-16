import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../providers/admin_contests_provider.dart';
import '../../data/models/admin_contest.dart';

class AdminContestsScreen extends ConsumerStatefulWidget {
  const AdminContestsScreen({super.key});

  @override
  ConsumerState<AdminContestsScreen> createState() => _AdminContestsScreenState();
}

class _AdminContestsScreenState extends ConsumerState<AdminContestsScreen> {
  // Search controller to filter administrative contests by title or code
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(adminContestsProvider.notifier).loadContests());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(adminContestsProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Contest Management'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(adminContestsProvider.notifier).loadContests(refresh: true),
        child: state.isLoading && state.contests.isEmpty
            ? _buildShimmerList()
            : _buildContent(state),
      ),
    );
  }

  Widget _buildContent(AdminContestsState state) {
    return Column(
      children: [
        _buildSearchBar(),
        _buildFilterChips(state),
        if (state.error != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text(state.error!, style: GoogleFonts.outfit(color: AppTheme.primaryRed, fontSize: 13)),
          ),
        Expanded(
          child: state.contests.isEmpty
              ? _buildEmpty()
              : ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: state.contests.length,
                  itemBuilder: (context, index) => _buildContestItem(state.contests[index]),
                ),
        ),
        _buildPagination(state),
      ],
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: TextField(
        controller: _searchController,
        style: GoogleFonts.outfit(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: 'Search contests...',
          hintStyle: GoogleFonts.outfit(color: AppTheme.greyMedium),
          prefixIcon: Icon(Icons.search_rounded, color: AppTheme.greyMedium, size: 22),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: Icon(Icons.clear_rounded, color: AppTheme.greyMedium, size: 20),
                  onPressed: () {
                    _searchController.clear();
                    ref.read(adminContestsProvider.notifier).setSearch(null);
                  },
                )
              : null,
          filled: true,
          fillColor: AppTheme.secondarySlate,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
        onSubmitted: (value) {
          ref.read(adminContestsProvider.notifier).setSearch(value.trim().isEmpty ? null : value.trim());
        },
      ),
    );
  }

  Widget _buildFilterChips(AdminContestsState state) {
    final filters = ['All', 'Running', 'Upcoming', 'Completed'];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: filters.map((filter) {
          final filterValue = filter == 'All' ? null : filter.toLowerCase();
          final isSelected = (filter == 'All' && state.statusFilter == null) ||
              state.statusFilter == filter.toLowerCase();
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () {
                ref.read(adminContestsProvider.notifier).setStatusFilter(filterValue);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primaryRed : AppTheme.secondarySlate,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected ? AppTheme.primaryRed : AppTheme.greyDark,
                  ),
                ),
                child: Text(
                  filter,
                  style: GoogleFonts.outfit(
                    color: isSelected ? Colors.white : AppTheme.greyMedium,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildContestItem(AdminContestSummary contest) {
    final Color statusColor;
    switch (contest.status.toLowerCase()) {
      case 'running':
        statusColor = AppTheme.emeraldGreen;
      case 'upcoming':
        statusColor = AppTheme.goldYellow;
      case 'completed':
      default:
        statusColor = AppTheme.greyMedium;
    }

    final progress = contest.totalSlots > 0
        ? contest.filledSlots / contest.totalSlots
        : 0.0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: () => context.push('/admin/contests/${contest.id}'),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: AppTheme.darkCardGradient,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x1FFFFFFF)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      contest.title,
                      style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 14),
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ),
                  const SizedBox(width: 8),
                  _statusBadge(contest.status, statusColor),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  _infoChip('Entry', '₹${contest.entryFeeDisplay}'),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _infoChip('Prize', contest.prizeDisplay.isNotEmpty ? contest.prizeDisplay : '—'),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '${contest.filledSlots}/${contest.totalSlots}',
                    style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 12),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: AppTheme.greyDark,
                  valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                  minHeight: 4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statusBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label.toUpperCase(),
        style: GoogleFonts.outfit(color: color, fontSize: 10, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _infoChip(String label, String value) {
    return Text.rich(
      TextSpan(
        children: [
          TextSpan(
            text: '$label: ',
            style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 12),
          ),
          TextSpan(
            text: value,
            style: GoogleFonts.outfit(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ],
      ),
      overflow: TextOverflow.ellipsis,
      maxLines: 1,
    );
  }

  Widget _buildPagination(AdminContestsState state) {
    final totalPages = (state.total / state.limit).ceil();
    if (totalPages <= 1) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0x1FFFFFFF))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          GestureDetector(
            onTap: state.page > 1 ? () => ref.read(adminContestsProvider.notifier).prevPage() : null,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: state.page > 1 ? AppTheme.secondarySlate : AppTheme.greyDark,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('Previous', style: GoogleFonts.outfit(color: state.page > 1 ? Colors.white : AppTheme.greyMedium, fontSize: 13)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text('Page ${state.page} of $totalPages', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 13)),
          ),
          GestureDetector(
            onTap: state.page < totalPages ? () => ref.read(adminContestsProvider.notifier).nextPage() : null,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: state.page < totalPages ? AppTheme.secondarySlate : AppTheme.greyDark,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('Next', style: GoogleFonts.outfit(color: state.page < totalPages ? Colors.white : AppTheme.greyMedium, fontSize: 13)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.sports_esports_outlined, size: 64, color: AppTheme.greyMedium.withValues(alpha: 0.5)),
          const SizedBox(height: 16),
          Text('No contests found', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildShimmerList() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: List.generate(5, (_) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: ShimmerCard(height: 110, borderRadius: 16),
      )),
    );
  }
}
