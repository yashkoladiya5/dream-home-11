import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import 'api_config.dart';
import 'certificate_pinning.dart';
import 'connectivity_service.dart';
import 'offline_request_queue.dart';

final apiClientProvider = Provider<Dio>((ref) {
  final options = BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: ApiConfig.connectTimeout,
    receiveTimeout: ApiConfig.receiveTimeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  );

  final dio = Dio(options);

  // SSL pinning for production/release builds
  if (!kIsWeb && kReleaseMode && ApiConfig.enableSslPinning) {
    dio.httpClientAdapter = IOHttpClientAdapter(
      createHttpClient: CertificatePinning.createPinnedHttpClient,
    );
  } else if (!kIsWeb && kReleaseMode) {
    // Release but pinning not required (staging)
    dio.httpClientAdapter = IOHttpClientAdapter(
      createHttpClient: () {
        final client = HttpClient(context: SecurityContext(withTrustedRoots: false));
        client.badCertificateCallback = (cert, host, port) => false;
        return client;
      },
    );
  }

  // JWT token interceptor
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final storage = ref.read(secureStorageProvider);
        final token = await storage.read(key: 'session_token');
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
    ),
  );

  // Offline request queue interceptor
  final offlineQueue = ref.read(offlineRequestQueueProvider);
  final connectivityService = ref.read(connectivityServiceProvider);
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        try {
          final isOnline = await connectivityService.checkConnectivity();
          if (!isOnline) {
            offlineQueue.enqueue(QueuedRequest(options: options, handler: handler));
            return;
          }
        } catch (e) {
          debugPrint('[ApiClient] Connectivity check failed: $e');
        }
        handler.next(options);
      },
    ),
  );

  // Logging only in debug mode
  if (!kReleaseMode) {
    dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));
  }

  return dio;
});
