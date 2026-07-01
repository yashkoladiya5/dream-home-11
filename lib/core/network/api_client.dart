import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';

final apiClientProvider = Provider<Dio>((ref) {
  String baseUrl = 'http://localhost:3000';
  if (!kIsWeb && Platform.isAndroid) {
    baseUrl = 'http://10.0.2.2:3000';
  }

  final options = BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  );

  final dio = Dio(options);

  // SSL pinning for production builds using proper PlatformAdapter
  if (!kIsWeb && kReleaseMode) {
    dio.httpClientAdapter = IOHttpClientAdapter(
      createHttpClient: () {
        final client = HttpClient(context: SecurityContext(withTrustedRoots: false));
        client.badCertificateCallback = (X509Certificate cert, String host, int port) {
          // SHA-256 certificate pinning
          // In production, pin the actual server certificate fingerprint(s)
          // For now, we reject all untrusted certificates in release mode
          // To pin a specific cert, compute its SHA-256 fingerprint and compare:
          //   final fingerprint = sha256.convert(cert.sha256).toString();
          //   return pinnedFingerprints.contains(fingerprint);
          return false;
        };
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

  // Logging only in debug mode
  if (!kReleaseMode) {
    dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));
  }

  return dio;
});
