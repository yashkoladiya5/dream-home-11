import 'dart:async';
import 'dart:io' show Platform;
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/chat_message.dart';

class ChatRepository {
  io.Socket? _socket;
  final _messageController = StreamController<ChatMessage>.broadcast();
  final _typingController = StreamController<Map<String, dynamic>>.broadcast();
  final _readReceiptController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();
  final _logController = StreamController<String>.broadcast();

  Stream<ChatMessage> get onNewMessage => _messageController.stream;
  Stream<Map<String, dynamic>> get onUserTyping => _typingController.stream;
  Stream<Map<String, dynamic>> get onMessageRead => _readReceiptController.stream;
  Stream<bool> get onConnectionChange => _connectionController.stream;
  Stream<String> get onLog => _logController.stream;

  bool get isConnected => _socket?.connected ?? false;

  void _log(String msg) {
    // ignore: avoid_print
    print('[ChatRepo] $msg');
    _logController.add(msg);
  }

  String get defaultServerUrl =>
      Platform.isAndroid ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

  void connect(String token, {String? serverUrl}) {
    serverUrl ??= defaultServerUrl;
    _log('connect() called, token length=${token.length}, currently connected=${_socket?.connected}');

    if (_socket?.connected == true) {
      _log('Already connected — skipping');
      return;
    }

    if (_socket != null) {
      _log('Cleaning up existing socket before reconnect');
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }

    _log('Creating socket.io connection to $serverUrl/chat');
    _log('Transports: websocket, auth token set');

    try {
      _socket = io.io(
        '$serverUrl/chat',
        io.OptionBuilder()
            .setTransports(['websocket'])
            .enableForceNew()
            .setAuth({'token': token})
            .build(),
      );

      _log('Socket instance created, registering event handlers...');

      _socket!.onConnect((_) {
        _log('✅ onConnect fired — socket.id=${_socket?.id}');
        _connectionController.add(true);
      });

      _socket!.onDisconnect((reason) {
        _log('❌ onDisconnect fired — reason=$reason');
        _connectionController.add(false);
      });

      _socket!.onConnectError((err) {
        _log('⚠️ onConnectError fired — error=$err');
        _connectionController.add(false);
      });

      _socket!.onError((err) {
        _log('⚠️ onError fired — error=$err');
      });

      _socket!.on('newMessage', (data) {
        _log('📨 Received newMessage event');
        if (data is Map<String, dynamic>) {
          _messageController.add(ChatMessage.fromJson(data));
        } else {
          _log('⚠️ newMessage data is not Map: ${data.runtimeType}');
        }
      });

      _socket!.on('userTyping', (data) {
        _log('✏️ Received userTyping event');
        if (data is Map<String, dynamic>) {
          _typingController.add(data);
        }
      });

      _socket!.on('messageRead', (data) {
        _log('👁️ Received messageRead event');
        if (data is Map<String, dynamic>) {
          _readReceiptController.add(data);
        }
      });

      _log('Calling socket.connect()...');
      _socket!.connect();
      _log('socket.connect() returned');

      // Check connection status after a short delay
      Future.delayed(const Duration(seconds: 2), () {
        _log('Connection status after 2s: connected=${_socket?.connected}, id=${_socket?.id}');
      });

      Future.delayed(const Duration(seconds: 5), () {
        _log('Connection status after 5s: connected=${_socket?.connected}, id=${_socket?.id}');
      });
    } catch (e) {
      _log('💥 Exception during connect(): $e');
      _connectionController.add(false);
    }
  }

  void disconnect() {
    _log('disconnect() called');
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _log('Socket disposed');
  }

  void joinChat(String chatId) {
    _log('joinChat($chatId) — connected=${_socket?.connected}');
    _socket?.emit('joinChat', {'chatId': chatId});
  }

  void leaveChat(String chatId) {
    _log('leaveChat($chatId)');
    _socket?.emit('leaveChat', {'chatId': chatId});
  }

  void sendMessage({required String chatId, required String content, String type = 'text'}) {
    _log('sendMessage(chatId=$chatId, content=$content, type=$type) — connected=${_socket?.connected}');
    _socket?.emit('sendMessage', {'chatId': chatId, 'content': content, 'type': type});
  }

  void sendTyping({required String chatId, required bool isTyping}) {
    _socket?.emit('typing', {'chatId': chatId, 'isTyping': isTyping});
  }

  void markRead({required String chatId, required String messageId}) {
    _socket?.emit('markRead', {'chatId': chatId, 'messageId': messageId});
  }

  void dispose() {
    _log('dispose() called');
    disconnect();
    _messageController.close();
    _typingController.close();
    _readReceiptController.close();
    _connectionController.close();
    _logController.close();
  }
}
