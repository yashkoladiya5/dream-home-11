import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/notification_log.dart';

class NotificationsNotifier extends StateNotifier<AsyncValue<List<NotificationLog>>> {
  final Ref ref;

  NotificationsNotifier(this.ref) : super(const AsyncValue.loading()) {
    fetchNotifications();
  }

  Future<void> fetchNotifications() async {
    try {
      final dio = ref.read(apiClientProvider);
      final response = await dio.get('/api/v1/notifications');
      final data = response.data['notifications'] as List<dynamic>;
      final list = data.map((e) => NotificationLog.fromJson(e as Map<String, dynamic>)).toList();
      state = AsyncValue.data(list);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      final dio = ref.read(apiClientProvider);
      await dio.patch('/api/v1/notifications/$id/read');

      state.whenData((list) {
        final updated = list.map((n) {
          if (n.id == id) {
            return NotificationLog(
              id: n.id,
              userId: n.userId,
              title: n.title,
              body: n.body,
              type: n.type,
              isRead: true,
              createdAt: n.createdAt,
            );
          }
          return n;
        }).toList();
        state = AsyncValue.data(updated);
      });
      // Force update the unread count provider
      ref.invalidate(unreadNotificationCountProvider);
    } catch (_) {}
  }

  Future<void> readAll() async {
    try {
      final dio = ref.read(apiClientProvider);
      await dio.post('/api/v1/notifications/read-all');

      state.whenData((list) {
        final updated = list.map((n) {
          return NotificationLog(
            id: n.id,
            userId: n.userId,
            title: n.title,
            body: n.body,
            type: n.type,
            isRead: true,
            createdAt: n.createdAt,
          );
        }).toList();
        state = AsyncValue.data(updated);
      });
      // Force update the unread count provider
      ref.invalidate(unreadNotificationCountProvider);
    } catch (_) {}
  }
}

final notificationsProvider = StateNotifierProvider<NotificationsNotifier, AsyncValue<List<NotificationLog>>>((ref) {
  return NotificationsNotifier(ref);
});

final unreadNotificationCountProvider = FutureProvider<int>((ref) async {
  try {
    final dio = ref.watch(apiClientProvider);
    final response = await dio.get('/api/v1/notifications/unread-count');
    return response.data['unreadCount'] as int? ?? 0;
  } catch (_) {
    return 0;
  }
});
