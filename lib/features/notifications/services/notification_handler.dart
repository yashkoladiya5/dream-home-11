import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import 'fcm_service.dart';

final notificationHandlerProvider = Provider<NotificationHandler>((ref) {
  final dio = ref.watch(apiClientProvider);
  return NotificationHandler(dio);
});

class NotificationHandler {
  final Dio _dio;
  late final FcmService _fcmService;

  NotificationHandler(this._dio);

  Future<void> initialize() async {
    _fcmService = FcmService(_dio);
    await _fcmService.requestPermission();
    final token = await _fcmService.getToken();
    await _fcmService.registerToken(token);
    _fcmService.setupTokenRefresh();
    _fcmService.configureHandlers(
      onForeground: (message) {
        debugPrint('Notification received in foreground: ${message.notification?.title}');
      },
      onBackground: (message) {
        debugPrint('Notification tapped: ${message.notification?.title}');
      },
    );
  }
}
