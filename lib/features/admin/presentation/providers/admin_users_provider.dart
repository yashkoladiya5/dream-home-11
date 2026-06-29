import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'admin_dashboard_provider.dart';
import '../../data/services/admin_api_service.dart';
import '../../data/models/admin_user_detail.dart';

class AdminUsersState {
  final List<AdminUserSummary> users;
  final int total;
  final int page;
  final int limit;
  final bool isLoading;
  final String? error;
  final String? search;
  final String? roleFilter;

  AdminUsersState({
    this.users = const [],
    this.total = 0,
    this.page = 1,
    this.limit = 20,
    this.isLoading = false,
    this.error,
    this.search,
    this.roleFilter,
  });

  AdminUsersState copyWith({
    List<AdminUserSummary>? users,
    int? total,
    int? page,
    int? limit,
    bool? isLoading,
    String? error,
    String? search,
    String? roleFilter,
  }) {
    return AdminUsersState(
      users: users ?? this.users,
      total: total ?? this.total,
      page: page ?? this.page,
      limit: limit ?? this.limit,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      search: search ?? this.search,
      roleFilter: roleFilter ?? this.roleFilter,
    );
  }
}

final adminUsersProvider = StateNotifierProvider<AdminUsersNotifier, AdminUsersState>((ref) {
  final service = ref.watch(adminApiServiceProvider);
  return AdminUsersNotifier(service);
});

class AdminUsersNotifier extends StateNotifier<AdminUsersState> {
  final AdminApiService _service;

  AdminUsersNotifier(this._service) : super(AdminUsersState());

  Future<void> loadUsers({bool refresh = false}) async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _service.getUsers(
        page: refresh ? 1 : state.page,
        limit: state.limit,
        search: state.search,
        role: state.roleFilter,
      );
      final users = (result['users'] as List)
          .map((e) => AdminUserSummary.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(
        users: users,
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
    loadUsers();
  }

  void setRoleFilter(String? role) {
    state = state.copyWith(roleFilter: role, page: 1);
    loadUsers();
  }

  void nextPage() {
    final next = state.page + 1;
    if ((next - 1) * state.limit < state.total) {
      state = state.copyWith(page: next);
      loadUsers();
    }
  }

  void prevPage() {
    if (state.page > 1) {
      state = state.copyWith(page: state.page - 1);
      loadUsers();
    }
  }
}
