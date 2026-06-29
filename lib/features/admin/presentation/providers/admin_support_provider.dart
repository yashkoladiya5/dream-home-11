import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'admin_dashboard_provider.dart';
import '../../data/services/admin_api_service.dart';

class AdminSupportState {
  final List<Map<String, dynamic>> tickets;
  final int total;
  final int page;
  final int limit;
  final bool isLoading;
  final String? error;
  final String? statusFilter;

  AdminSupportState({
    this.tickets = const [],
    this.total = 0,
    this.page = 1,
    this.limit = 20,
    this.isLoading = false,
    this.error,
    this.statusFilter,
  });

  AdminSupportState copyWith({
    List<Map<String, dynamic>>? tickets,
    int? total,
    int? page,
    int? limit,
    bool? isLoading,
    String? error,
    Object? statusFilter = const Object(),
  }) {
    return AdminSupportState(
      tickets: tickets ?? this.tickets,
      total: total ?? this.total,
      page: page ?? this.page,
      limit: limit ?? this.limit,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      statusFilter: statusFilter is String? ? statusFilter : this.statusFilter,
    );
  }
}

final adminSupportProvider = StateNotifierProvider<AdminSupportNotifier, AdminSupportState>((ref) {
  final service = ref.watch(adminApiServiceProvider);
  return AdminSupportNotifier(service);
});

class AdminSupportNotifier extends StateNotifier<AdminSupportState> {
  final AdminApiService _service;

  AdminSupportNotifier(this._service) : super(AdminSupportState());

  Future<void> loadTickets({bool refresh = false}) async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _service.getSupportTickets(
        page: refresh ? 1 : state.page,
        limit: state.limit,
        status: state.statusFilter,
      );
      final tickets = (result['tickets'] as List)
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      state = state.copyWith(
        tickets: tickets,
        total: result['total'] as int? ?? 0,
        page: result['page'] as int? ?? 1,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setStatusFilter(String? status) {
    state = state.copyWith(statusFilter: status, page: 1);
    loadTickets();
  }
}
