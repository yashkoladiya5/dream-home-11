import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../../../core/network/api_config.dart';
import '../models/activity_event.dart';
import '../models/leaderboard_entry.dart';

class ContestSocketService {
  io.Socket? _socket;
  final _activityController = StreamController<ActivityEvent>.broadcast();
  final _leaderboardController = StreamController<List<LeaderboardEntry>>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();

  Stream<ActivityEvent> get onActivity => _activityController.stream;
  Stream<List<LeaderboardEntry>> get onLeaderboardUpdate => _leaderboardController.stream;
  Stream<bool> get onConnectionChange => _connectionController.stream;

  bool get isConnected => _socket?.connected ?? false;

  void connect(String token, String contestId) {
    if (_socket?.connected == true) return;

    _socket = io.io(
      '${ApiConfig.baseUrl}/contest',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .enableForceNew()
          .setAuth({'token': token})
          .build(),
    );

    _socket!.onConnect((_) {
      _connectionController.add(true);
      _socket!.emit('contest.join', {'contestId': contestId});
    });

    _socket!.on('contest.activity', (data) {
      final event = ActivityEvent.fromJson(data as Map<String, dynamic>);
      _activityController.add(event);
    });

    _socket!.on('contest.leaderboardUpdate', (data) {
      final entries = (data as List)
          .map((e) => LeaderboardEntry.fromJson(e as Map<String, dynamic>))
          .toList();
      _leaderboardController.add(entries);
    });

    _socket!.onDisconnect((_) => _connectionController.add(false));
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _activityController.close();
    _leaderboardController.close();
    _connectionController.close();
  }
}
