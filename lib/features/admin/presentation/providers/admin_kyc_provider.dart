import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'admin_dashboard_provider.dart';
import '../../data/services/admin_api_service.dart';

class AdminKycState {
  final List<Map<String, dynamic>> submissions;
  final int total;
  final int page;
  final int limit;
  final bool isLoading;
  final String? error;
  final String? statusFilter;

  AdminKycState({
    this.submissions = const [],
    this.total = 0,
    this.page = 1,
    this.limit = 20,
    this.isLoading = false,
    this.error,
    this.statusFilter,
  });

  AdminKycState copyWith({
    List<Map<String, dynamic>>? submissions,
    int? total,
    int? page,
    int? limit,
    bool? isLoading,
    String? error,
    String? statusFilter,
  }) {
    return AdminKycState(
      submissions: submissions ?? this.submissions,
      total: total ?? this.total,
      page: page ?? this.page,
      limit: limit ?? this.limit,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      statusFilter: statusFilter ?? this.statusFilter,
    );
  }
}

final adminKycProvider = StateNotifierProvider<AdminKycNotifier, AdminKycState>((ref) {
  final service = ref.watch(adminApiServiceProvider);
  return AdminKycNotifier(service);
});

class AdminKycNotifier extends StateNotifier<AdminKycState> {
  final AdminApiService _service;

  AdminKycNotifier(this._service) : super(AdminKycState());

  Future<void> loadSubmissions({bool refresh = false}) async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _service.getKycSubmissions(
        page: refresh ? 1 : state.page,
        limit: state.limit,
        status: state.statusFilter,
      );
      final submissions = (result['submissions'] as List)
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      state = state.copyWith(
        submissions: submissions,
        total: result['total'] as int? ?? 0,
        page: result['page'] as int? ?? 1,
        isLoading: false,
      );
    } catch (e, stack) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void setStatusFilter(String? status) {
    state = state.copyWith(statusFilter: status, page: 1);
    loadSubmissions();
  }

  Future<bool> approveKyc(String id) async {
    try {
      await _service.approveKyc(id);
      await loadSubmissions(refresh: true);
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  Future<bool> rejectKyc(String id, {String? reason}) async {
    try {
      await _service.rejectKyc(id, reason: reason);
      await loadSubmissions(refresh: true);
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }
}
