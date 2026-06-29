import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../providers/admin_users_provider.dart';
import '../../data/models/admin_user_detail.dart';

class AdminUsersScreen extends ConsumerStatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  ConsumerState<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends ConsumerState<AdminUsersScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(adminUsersProvider.notifier).loadUsers());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(adminUsersProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('User Management'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(adminUsersProvider.notifier).loadUsers(refresh: true),
        child: state.isLoading && state.users.isEmpty
            ? _buildShimmerList()
            : _buildContent(state),
      ),
    );
  }

  Widget _buildContent(AdminUsersState state) {
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
          child: state.users.isEmpty
              ? _buildEmpty()
              : ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: state.users.length,
                  itemBuilder: (context, index) => _buildUserItem(state.users[index]),
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
          hintText: 'Search by name or phone...',
          hintStyle: GoogleFonts.outfit(color: AppTheme.greyMedium),
          prefixIcon: Icon(Icons.search_rounded, color: AppTheme.greyMedium, size: 22),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: Icon(Icons.clear_rounded, color: AppTheme.greyMedium, size: 20),
                  onPressed: () {
                    _searchController.clear();
                    ref.read(adminUsersProvider.notifier).setSearch(null);
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
          ref.read(adminUsersProvider.notifier).setSearch(value.trim().isEmpty ? null : value.trim());
        },
      ),
    );
  }

  Widget _buildFilterChips(AdminUsersState state) {
    final filters = ['All', 'User', 'Admin', 'Moderator'];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: filters.map((filter) {
          final isSelected = (filter == 'All' && state.roleFilter == null) ||
              state.roleFilter == filter.toLowerCase();
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () {
                ref.read(adminUsersProvider.notifier)
                    .setRoleFilter(filter == 'All' ? null : filter.toLowerCase());
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

  Widget _buildUserItem(AdminUserSummary user) {
    final statusColor = user.isActive ? AppTheme.emeraldGreen : AppTheme.greyMedium;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: () => context.push('/admin/users/${user.id}'),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            gradient: AppTheme.darkCardGradient,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x1FFFFFFF)),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: AppTheme.primaryRed.withValues(alpha: 0.2),
                child: Text(
                  (user.fullName ?? user.phoneNumber)[0].toUpperCase(),
                  style: GoogleFonts.outfit(color: AppTheme.primaryRed, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            user.fullName ?? 'User',
                            style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 14),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: statusColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(user.phoneNumber, style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 13)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (user.role != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  margin: const EdgeInsets.only(right: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryRed.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(user.role!, style: GoogleFonts.outfit(color: AppTheme.primaryRed, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              _tierBadge(user.currentTier),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPagination(AdminUsersState state) {
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
            onTap: state.page > 1 ? () => ref.read(adminUsersProvider.notifier).prevPage() : null,
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
            onTap: state.page < totalPages ? () => ref.read(adminUsersProvider.notifier).nextPage() : null,
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
          Icon(Icons.people_outline_rounded, size: 64, color: AppTheme.greyMedium.withValues(alpha: 0.5)),
          const SizedBox(height: 16),
          Text('No users found', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildShimmerList() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: List.generate(5, (_) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: ShimmerCard(height: 68, borderRadius: 16),
      )),
    );
  }

  Widget _tierBadge(String tier) {
    final Color color;
    switch (tier.toLowerCase()) {
      case 'bronze':
        color = const Color(0xFFCD7F32);
      case 'silver':
        color = AppTheme.greyLight;
      case 'gold':
        color = AppTheme.goldYellow;
      case 'platinum':
        color = const Color(0xFFE5E4E2);
      default:
        color = AppTheme.greyMedium;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(tier.toUpperCase(), style: GoogleFonts.outfit(color: color, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }
}
