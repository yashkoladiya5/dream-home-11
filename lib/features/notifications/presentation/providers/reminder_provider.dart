import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/reminder.dart';

final remindersProvider = StateNotifierProvider<ReminderNotifier, AsyncValue<List<Reminder>>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return ReminderNotifier(dio);
});

class ReminderNotifier extends StateNotifier<AsyncValue<List<Reminder>>> {
  final Dio _dio;

  ReminderNotifier(this._dio) : super(const AsyncValue.loading());

  Future<void> fetchReminders() async {
    state = const AsyncValue.loading();
    try {
      final response = await _dio.get('/api/v1/notifications/reminders');
      final list = (response.data as List)
          .map((e) => Reminder.fromJson(e as Map<String, dynamic>))
          .toList();
      state = AsyncValue.data(list);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<Map<String, dynamic>?> createReminder({
    required String contestId,
    required DateTime remindAt,
  }) async {
    try {
      final response = await _dio.post('/api/v1/notifications/reminders', data: {
        'contestId': contestId,
        'remindAt': remindAt.toIso8601String(),
      });
      await fetchReminders();
      return response.data as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }

  Future<bool> deleteReminder(String id) async {
    try {
      await _dio.delete('/api/v1/notifications/reminders/$id');
      await fetchReminders();
      return true;
    } catch (e) {
      return false;
    }
  }
}
