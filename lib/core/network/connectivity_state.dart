import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'connectivity_service.dart';

enum ConnectionType { wifi, cellular, none }

class ConnectivityState {
  final bool isOnline;
  final bool isSlow;
  final ConnectionType connectionType;
  final DateTime? lastOnlineTime;

  const ConnectivityState({
    this.isOnline = false,
    this.isSlow = false,
    this.connectionType = ConnectionType.none,
    this.lastOnlineTime,
  });

  ConnectivityState copyWith({
    bool? isOnline,
    bool? isSlow,
    ConnectionType? connectionType,
    DateTime? lastOnlineTime,
  }) {
    return ConnectivityState(
      isOnline: isOnline ?? this.isOnline,
      isSlow: isSlow ?? this.isSlow,
      connectionType: connectionType ?? this.connectionType,
      lastOnlineTime: lastOnlineTime ?? this.lastOnlineTime,
    );
  }
}

final connectivityStateProvider = StreamProvider<ConnectivityState>((ref) {
  final connectivityService = ref.watch(connectivityServiceProvider);
  final controller = StreamController<ConnectivityState>.broadcast();

  DateTime? lastOnline;

  final sub = connectivityService.onConnectivityChanged.listen((isOnline) {
    if (isOnline) lastOnline = DateTime.now();
    controller.add(ConnectivityState(
      isOnline: isOnline,
      lastOnlineTime: lastOnline,
    ));
  });

  ref.onDispose(() {
    sub.cancel();
    controller.close();
  });

  connectivityService.checkConnectivity().then((isOnline) {
    if (isOnline) lastOnline = DateTime.now();
    controller.add(ConnectivityState(
      isOnline: isOnline,
      lastOnlineTime: lastOnline,
    ));
  });

  return controller.stream;
});

class ConnectivityBanner extends ConsumerWidget {
  const ConnectivityBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stateAsync = ref.watch(connectivityStateProvider);
    return stateAsync.when(
      data: (state) {
        if (!state.isOnline) {
          return Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            color: Colors.orange.shade800,
            child: Row(
              children: [
                const Icon(Icons.wifi_off_rounded, color: Colors.white, size: 18),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'You are offline',
                    style: TextStyle(color: Colors.white, fontSize: 13),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    ref.read(connectivityServiceProvider).checkConnectivity();
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                  child: const Text('Retry',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          );
        }
        return const SizedBox.shrink();
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}
