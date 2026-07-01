import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_search_provider.dart';

class FindPeopleScreen extends ConsumerStatefulWidget {
  const FindPeopleScreen({super.key});

  @override
  ConsumerState<FindPeopleScreen> createState() => _FindPeopleScreenState();
}

class _FindPeopleScreenState extends ConsumerState<FindPeopleScreen> {
  final _searchController = TextEditingController();
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchController.text;
    if (query.isEmpty && _isSearching) {
      setState(() => _isSearching = false);
      ref.read(userSearchProvider.notifier).clearSearch();
    }
  }

  void _onSubmit(String value) {
    final query = value.trim();
    if (query.isEmpty) return;
    setState(() => _isSearching = true);
    ref.read(userSearchProvider.notifier).search(query);
  }

  @override
  Widget build(BuildContext context) {
    final searchAsync = ref.watch(userSearchProvider);
    final topUsersAsync = ref.watch(topUsersProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Find People'),
        centerTitle: true,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _searchController,
              onSubmitted: _onSubmit,
              textInputAction: TextInputAction.search,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Search by name...',
                hintStyle: TextStyle(color: AppTheme.greyMedium.withValues(alpha: 0.7)),
                prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.greyMedium),
                suffixIcon: _isSearching
                    ? IconButton(
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _isSearching = false);
                          ref.read(userSearchProvider.notifier).clearSearch();
                        },
                        icon: const Icon(Icons.close_rounded, color: AppTheme.greyMedium),
                      )
                    : null,
                filled: true,
                fillColor: const Color(0x0CFFFFFF),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0x1FFFFFFF)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0x1FFFFFFF)),
                ),
              ),
            ),
          ),

          Expanded(
            child: _isSearching
                ? searchAsync.when(
                    data: (users) {
                      if (users.isEmpty) {
                        return Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 64, height: 64,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: const Color(0x1AFFFFFF),
                                ),
                                child: const Icon(Icons.person_search_rounded, size: 32, color: AppTheme.greyMedium),
                              ),
                              const SizedBox(height: 16),
                              Text('No users found', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                            ],
                          ),
                        );
                      }
                      return ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: users.length,
                        itemExtent: 64,
                        itemBuilder: (context, index) => _UserTile(user: users[index]),
                      );
                    },
                    loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryRed)),
                    error: (err, stack) => Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 48),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => ref.read(userSearchProvider.notifier).search(_searchController.text.trim()),
                            child: const Text('RETRY'),
                          ),
                        ],
                      ),
                    ),
                  )
                : topUsersAsync.when(
                    data: (users) {
                      if (users.isEmpty) {
                        return const SizedBox.shrink();
                      }
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            child: Text(
                              'Top Players',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                            ),
                          ),
                          Expanded(
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: users.length,
                              itemExtent: 64,
                              itemBuilder: (context, index) => _UserTile(
                                user: users[index],
                                rank: index + 1,
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                    loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryRed)),
                    error: (err, stack) => const SizedBox.shrink(),
                  ),
          ),
        ],
      ),
    );
  }
}

class _UserTile extends StatelessWidget {
  final dynamic user;
  final int? rank;

  const _UserTile({required this.user, this.rank});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            if (rank != null) ...[
              SizedBox(
                width: 28,
                child: Text(
                  '#$rank',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: rank == 1 ? AppTheme.goldYellow : AppTheme.greyMedium,
                        fontSize: 13,
                      ),
                ),
              ),
              const SizedBox(width: 8),
            ],
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppTheme.primaryGradient,
              ),
              child: Center(
                child: Text(
                  _getInitials(user.fullName),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.fullName ?? 'Anonymous',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  if (user.lifetimePoints > 0)
                    Text(
                      '${user.lifetimePoints} pts',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium, fontSize: 11),
                    ),
                ],
              ),
            ),
            if (user.currentTier != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _tierColor(user.currentTier!).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  user.currentTier!,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _tierColor(user.currentTier!)),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _getInitials(String? name) {
    if (name == null || name.isEmpty) return '?';
    final parts = name.split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return parts[0][0].toUpperCase();
  }

  Color _tierColor(String tier) {
    switch (tier.toUpperCase()) {
      case 'PLATINUM': return const Color(0xFFE5E4E2);
      case 'GOLD': return AppTheme.goldYellow;
      case 'SILVER': return const Color(0xFFC0C0C0);
      case 'BRONZE': return const Color(0xFFCD7F32);
      default: return AppTheme.greyMedium;
    }
  }
}
