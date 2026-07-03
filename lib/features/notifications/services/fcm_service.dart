import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';

class FcmService {
  final FirebaseMessaging _messaging;
  final Dio _dio;
  StreamSubscription? _tokenRefreshSubscription;
  StreamSubscription? _onMessageSubscription;
  StreamSubscription? _onMessageOpenedAppSubscription;

  FcmService(this._dio) : _messaging = FirebaseMessaging.instance;

  Future<String?> getToken() async {
    try {
      final token = await _messaging.getToken();
      return token;
    } catch (e) {
      debugPrint('FCM getToken error: $e');
      return null;
    }
  }

  Future<void> requestPermission() async {
    try {
      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      debugPrint('FCM permission: ${settings.authorizationStatus}');
    } catch (e) {
      debugPrint('FCM permission error: $e');
    }
  }

  Future<void> registerToken(String? token, {String deviceType = 'ios'}) async {
    if (token == null) return;
    try {
      await _dio.post(
        '/api/v1/notifications/fcm-token',
        data: {'token': token, 'deviceType': deviceType},
      );
    } catch (e) {
      debugPrint('FCM register token error: $e');
    }
  }

  Future<void> setupTokenRefresh() async {
    _tokenRefreshSubscription = _messaging.onTokenRefresh.listen((newToken) {
      registerToken(newToken);
    });
  }

  void configureHandlers({
    void Function(RemoteMessage)? onForeground,
    void Function(RemoteMessage)? onBackground,
  }) {
    _onMessageSubscription = FirebaseMessaging.onMessage.listen((message) {
      debugPrint('FCM foreground message: ${message.notification?.title}');
      onForeground?.call(message);
    });

    _onMessageOpenedAppSubscription = FirebaseMessaging.onMessageOpenedApp.listen((message) {
      debugPrint('FCM opened app: ${message.notification?.title}');
      onBackground?.call(message);
    });

    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message != null) {
        debugPrint('FCM initial message: ${message.notification?.title}');
        onBackground?.call(message);
      }
    });
  }

  void dispose() {
    _tokenRefreshSubscription?.cancel();
    _onMessageSubscription?.cancel();
    _onMessageOpenedAppSubscription?.cancel();
  }
}
