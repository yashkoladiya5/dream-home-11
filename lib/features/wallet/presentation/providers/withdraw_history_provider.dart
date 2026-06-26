import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/withdraw_model.dart';

final withdrawHistoryScreenProvider = StateNotifierProvider<WithdrawHistoryListNotifier, AsyncValue<WithdrawalHistory>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return WithdrawHistoryListNotifier(dio);
});

class WithdrawHistoryListNotifier extends StateNotifier<AsyncValue<WithdrawalHistory>> {
  final Dio _dio;
  int _currentPage = 1;
  List<WithdrawalRecord> _allWithdrawals = [];
  bool _isLoadingMore = false;

  WithdrawHistoryListNotifier(this._dio) : super(const AsyncValue.loading()) {
    loadPage(1);
  }

  Future<void> loadPage(int page) async {
    if (page == 1) {
      state = const AsyncValue.loading();
    }
    try {
      final response = await _dio.get('/api/v1/payments/withdraw/history', queryParameters: {'page': page, 'limit': 20});
      final history = WithdrawalHistory.fromJson(response.data as Map<String, dynamic>);

      if (page == 1) {
        _allWithdrawals = history.withdrawals;
      } else {
        _allWithdrawals.addAll(history.withdrawals);
      }
      _currentPage = page;

      state = AsyncValue.data(WithdrawalHistory(
        withdrawals: _allWithdrawals,
        total: history.total,
        page: _currentPage,
        totalPages: history.totalPages,
      ));
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<void> loadNextPage() async {
    if (_isLoadingMore) return;
    final currentState = state.valueOrNull;
    if (currentState == null || _currentPage >= currentState.totalPages) return;

    _isLoadingMore = true;
    await loadPage(_currentPage + 1);
    _isLoadingMore = false;
  }

  bool get hasMore {
    final currentState = state.valueOrNull;
    if (currentState == null) return false;
    return _currentPage < currentState.totalPages;
  }

  bool get isLoadingMore => _isLoadingMore;

  Future<void> refresh() async {
    _currentPage = 1;
    _allWithdrawals = [];
    await loadPage(1);
  }
}
