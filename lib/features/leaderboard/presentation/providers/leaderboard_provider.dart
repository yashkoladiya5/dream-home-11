import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/leaderboard_models.dart';
import '../../data/repositories/leaderboard_repository.dart';

final leaderboardRepositoryProvider = Provider<LeaderboardRepository>((ref) {
  final dio = ref.watch(apiClientProvider);
  return LeaderboardRepository(dio);
});

final leaderboardProvider = StateNotifierProvider<LeaderboardNotifier, AsyncValue<LeaderboardResponse>>((ref) {
  final repo = ref.watch(leaderboardRepositoryProvider);
  return LeaderboardNotifier(repo);
});

class LeaderboardNotifier extends StateNotifier<AsyncValue<LeaderboardResponse>> {
  final LeaderboardRepository _repo;
  int _currentPage = 1;
  List<LeaderboardEntry> _allEntries = [];
  bool _isLoadingMore = false;
  String _searchQuery = '';
  bool _isSearching = false;
  LeaderboardCycle _currentCycle = LeaderboardCycle.allTime;
  String? _selectedContestId;

  LeaderboardNotifier(this._repo) : super(const AsyncValue.loading()) {
    loadPage(1);
  }

  int get currentPage => _currentPage;
  bool get isLoadingMore => _isLoadingMore;
  bool get isSearching => _isSearching;
  String get searchQuery => _searchQuery;
  LeaderboardCycle get currentCycle => _currentCycle;
  String? get selectedContestId => _selectedContestId;

  String get cycleLabel {
    switch (_currentCycle) {
      case LeaderboardCycle.weekly:
        return 'This Week';
      case LeaderboardCycle.monthly:
        return 'This Month';
      case LeaderboardCycle.custom:
        return 'Events';
      default:
        return 'All Time';
    }
  }

  Future<void> setCycle(LeaderboardCycle cycle) async {
    if (cycle == _currentCycle) return;
    _currentCycle = cycle;
    _selectedContestId = null;
    _currentPage = 1;
    _allEntries = [];
    _searchQuery = '';
    _isSearching = false;
    if (cycle == LeaderboardCycle.custom) {
      state = AsyncValue.data(LeaderboardResponse(
        entries: [],
        totalCount: 0,
        cycle: _currentCycle,
      ));
    } else {
      await loadPage(1);
    }
  }

  Future<void> setContest(String contestId) async {
    _selectedContestId = contestId;
    _currentCycle = LeaderboardCycle.custom;
    _currentPage = 1;
    _allEntries = [];
    _searchQuery = '';
    _isSearching = false;
    await loadPage(1);
  }

  Future<void> clearContest() async {
    _selectedContestId = null;
    _currentCycle = LeaderboardCycle.allTime;
    _currentPage = 1;
    _allEntries = [];
    _searchQuery = '';
    _isSearching = false;
    await loadPage(1);
  }

  Future<void> loadPage(int page) async {
    if (page == 1) {
      _allEntries = [];
      state = const AsyncValue.loading();
    }
    try {
      LeaderboardResponse response;
      if (_isSearching && _searchQuery.isNotEmpty) {
        response = await _repo.searchUsers(query: _searchQuery, page: page, cycle: _currentCycle);
      } else if (_currentCycle == LeaderboardCycle.custom && _selectedContestId != null) {
        response = await _repo.getSeriesLeaderboard(contestId: _selectedContestId!, page: page);
      } else {
        response = await _repo.getGlobalLeaderboard(page: page, cycle: _currentCycle);
      }

      if (page == 1) {
        _allEntries = response.entries;
      } else {
        _allEntries.addAll(response.entries);
      }
      _currentPage = page;

      state = AsyncValue.data(LeaderboardResponse(
        entries: _allEntries,
        userRank: response.userRank,
        totalCount: response.totalCount,
        cycle: _currentCycle,
      ));
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<void> loadNextPage() async {
    if (_isLoadingMore) return;
    final currentState = state.valueOrNull;
    if (currentState == null || _allEntries.length >= currentState.totalCount) return;

    _isLoadingMore = true;
    await loadPage(_currentPage + 1);
    _isLoadingMore = false;
  }

  bool get hasMore {
    final currentState = state.valueOrNull;
    if (currentState == null) return false;
    return _allEntries.length < currentState.totalCount;
  }

  Future<void> search(String query) async {
    _searchQuery = query.trim();
    _isSearching = _searchQuery.isNotEmpty;
    _currentPage = 1;
    _allEntries = [];
    await loadPage(1);
  }

  Future<void> refresh() async {
    _currentPage = 1;
    _allEntries = [];
    _searchQuery = '';
    _isSearching = false;
    _selectedContestId = null;
    await loadPage(1);
  }
}
