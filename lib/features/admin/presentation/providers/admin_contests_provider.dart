import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'admin_dashboard_provider.dart';
import '../../data/services/admin_api_service.dart';
import '../../data/models/admin_contest.dart';

class AdminContestsState {
  final List<AdminContestSummary> contests;
  final int total;
  final int page;
  final int limit;
  final bool isLoading;
  final String? error;
  final String? search;
  final String? statusFilter;

  AdminContestsState({
    this.contests = const [],
    this.total = 0,
    this.page = 1,
    this.limit = 20,
    this.isLoading = false,
    this.error,
    this.search,
    this.statusFilter,
  });

  AdminContestsState copyWith({
    List<AdminContestSummary>? contests,
    int? total,
    int? page,
    int? limit,
    bool? isLoading,
    String? error,
    String? search,
    String? statusFilter,
  }) {
    return AdminContestsState(
      contests: contests ?? this.contests,
      total: total ?? this.total,
      page: page ?? this.page,
      limit: limit ?? this.limit,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      search: search ?? this.search,
      statusFilter: statusFilter ?? this.statusFilter,
    );
  }
}

final adminContestsProvider = StateNotifierProvider<AdminContestsNotifier, AdminContestsState>((ref) {
  final service = ref.watch(adminApiServiceProvider);
  return AdminContestsNotifier(service);
});

class AdminContestsNotifier extends StateNotifier<AdminContestsState> {
  final AdminApiService _service;

  AdminContestsNotifier(this._service) : super(AdminContestsState());

  Future<void> loadContests({bool refresh = false}) async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _service.getContests(
        page: refresh ? 1 : state.page,
        limit: state.limit,
        search: state.search,
        status: state.statusFilter,
      );
      final contests = (result['contests'] as List)
          .map((e) => AdminContestSummary.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(
        contests: contests,
        total: result['total'] as int? ?? 0,
        page: result['page'] as int? ?? 1,
        isLoading: false,
      );
    } catch (e, stack) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setSearch(String? search) {
    state = state.copyWith(search: search, page: 1);
    loadContests();
  }

  void setStatusFilter(String? status) {
    state = state.copyWith(statusFilter: status, page: 1);
    loadContests();
  }

  void nextPage() {
    final next = state.page + 1;
    if ((next - 1) * state.limit < state.total) {
      state = state.copyWith(page: next);
      loadContests();
    }
  }

  void prevPage() {
    if (state.page > 1) {
      state = state.copyWith(page: state.page - 1);
      loadContests();
    }
  }
}
