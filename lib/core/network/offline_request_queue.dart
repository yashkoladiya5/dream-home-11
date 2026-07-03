import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'connectivity_service.dart';

class QueuedRequest {
  final RequestOptions options;
  final RequestInterceptorHandler handler;
  final DateTime queuedAt;
  int retryCount;

  QueuedRequest({
    required this.options,
    required this.handler,
    DateTime? queuedAt,
    this.retryCount = 0,
  }) : queuedAt = queuedAt ?? DateTime.now();
}

class OfflineRequestQueue {
  final List<QueuedRequest> _queue = [];
  bool _isReplaying = false;
  StreamSubscription<bool>? _connectivitySubscription;

  static const int _maxRetries = 3;
  static const Duration _retryDelay = Duration(seconds: 5);

  bool get hasPendingRequests => _queue.isNotEmpty;

  int get pendingCount => _queue.length;

  void startMonitoring(Stream<bool> connectivityStream) {
    _connectivitySubscription?.cancel();
    _connectivitySubscription = connectivityStream.listen((isConnected) {
      if (isConnected && _queue.isNotEmpty && !_isReplaying) {
        _replayQueue();
      }
    });
  }

  void enqueue(QueuedRequest request) {
    _queue.add(request);
    if (!kReleaseMode) {
      debugPrint('[OfflineRequestQueue] Queued ${request.options.method} ${request.options.path} (total: ${_queue.length})');
    }
  }

  Future<void> _replayQueue() async {
    if (_isReplaying) return;
    _isReplaying = true;

    final requests = List<QueuedRequest>.from(_queue);
    _queue.clear();

    for (final request in requests) {
      if (request.retryCount >= _maxRetries) {
        if (!kReleaseMode) {
          debugPrint('[OfflineRequestQueue] Max retries reached for ${request.options.method} ${request.options.path}');
        }
        request.handler.reject(DioException(
          requestOptions: request.options,
          error: 'Max retries reached',
          type: DioExceptionType.connectionError,
        ));
        continue;
      }

      try {
        await Future.delayed(_retryDelay);
        final response = await Dio().fetch(request.options);
        request.handler.resolve(response);
        if (!kReleaseMode) {
          debugPrint('[OfflineRequestQueue] Replayed ${request.options.method} ${request.options.path}');
        }
      } on DioException catch (e) {
        if (e.type == DioExceptionType.connectionError ||
            e.type == DioExceptionType.connectionTimeout) {
          request.retryCount++;
          _queue.insert(0, request);
          if (!kReleaseMode) {
            debugPrint('[OfflineRequestQueue] Still offline, re-queued ${request.options.method} ${request.options.path} (retry ${request.retryCount}/$_maxRetries)');
          }
        } else {
          request.handler.reject(e);
        }
      } catch (e) {
        request.handler.reject(DioException(
          requestOptions: request.options,
          error: e.toString(),
          type: DioExceptionType.unknown,
        ));
      }
    }

    _isReplaying = false;

    if (_queue.isNotEmpty) {
      if (!kReleaseMode) {
        debugPrint('[OfflineRequestQueue] ${_queue.length} requests still pending');
      }
    }
  }

  void dispose() {
    _connectivitySubscription?.cancel();
    _queue.clear();
  }
}

final offlineRequestQueueProvider = Provider<OfflineRequestQueue>((ref) {
  final queue = OfflineRequestQueue();
  final connectivityService = ref.read(connectivityServiceProvider);
  ref.onDispose(() => queue.dispose());

  queue.startMonitoring(connectivityService.onConnectivityChanged);

  return queue;
});
