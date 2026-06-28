import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/chat_provider.dart';
import '../../data/models/chat_message.dart';

import 'dart:io' show Platform;

final _secureStorage = FlutterSecureStorage();

class ChatListScreen extends ConsumerStatefulWidget {
  const ChatListScreen({super.key});

  @override
  ConsumerState<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends ConsumerState<ChatListScreen> {
  final _serverUrlController = TextEditingController(
    text: Platform.isAndroid ? 'http://10.0.2.2:3000' : 'http://localhost:3000',
  );
  final _chatIdController = TextEditingController(text: 'chat-test-1');
  final _messageController = TextEditingController();
  final _tokenController = TextEditingController();
  final List<ChatMessage> _messages = [];
  final List<String> _logs = [];
  bool _isJoined = false;
  bool _isConnected = false;
  bool _connecting = false;
  String? _token;
  bool _showLogs = true;

  @override
  void initState() {
    super.initState();
    _loadToken();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final repo = ref.read(chatRepositoryProvider);
        if (repo.isConnected) {
          setState(() => _isConnected = true);
        }
      }
    });
  }

  Future<void> _loadToken() async {
    final token = await _secureStorage.read(key: 'auth_token');
    if (mounted) {
      setState(() {
        _token = token;
        _tokenController.text = token ?? '';
      });
    }
  }

  void _connect() async {
    final token = _tokenController.text.trim();
    final serverUrl = _serverUrlController.text.trim();
    if (token.isEmpty) {
      _addLog('No token provided');
      return;
    }

    setState(() => _connecting = true);
    _addLog('Connecting to $serverUrl/chat');
    _addLog('Token: ${token.substring(0, 12)}...${token.substring(token.length - 4)}');

    final repo = ref.read(chatRepositoryProvider);
    repo.connect(token, serverUrl: serverUrl);

    await _secureStorage.write(key: 'auth_token', value: token);
    setState(() => _token = token);
  }

  void _disconnect() {
    _addLog('Disconnecting...');
    ref.read(chatRepositoryProvider).disconnect();
    setState(() => _isJoined = false);
  }

  void _toggleJoin() {
    final chatId = _chatIdController.text.trim();
    if (chatId.isEmpty) return;
    if (_isJoined) {
      ref.read(chatActionsProvider).leaveChat(chatId);
    } else {
      ref.read(chatActionsProvider).joinChat(chatId);
    }
    setState(() => _isJoined = !_isJoined);
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    final chatId = _chatIdController.text.trim();
    if (text.isEmpty || chatId.isEmpty) return;
    ref.read(chatActionsProvider).sendMessage(chatId: chatId, content: text);
    _messageController.clear();
  }

  void _addLog(String msg) {
    final timestamp = DateTime.now().toString().substring(11, 19);
    setState(() => _logs.insert(0, '[$timestamp] $msg'));
  }

  @override
  void dispose() {
    _serverUrlController.dispose();
    _chatIdController.dispose();
    _messageController.dispose();
    _tokenController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(chatConnectionProvider, (prev, next) {
      next.whenData((connected) {
        _addLog('Connection status changed: connected=$connected');
        if (mounted) {
          setState(() {
            _isConnected = connected;
            _connecting = false;
          });
        }
      });
    });
    ref.listen(chatLogProvider, (prev, next) {
      next.whenData((log) {
        if (mounted) _addLog(log);
      });
    });
    ref.listen(newMessageProvider, (prev, next) {
      next.whenData((msg) {
        _addLog('New message received from ${msg.senderId}');
        if (mounted) setState(() => _messages.insert(0, msg));
      });
    });

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isConnected
                    ? AppTheme.emeraldGreen
                    : _connecting
                        ? AppTheme.goldYellow
                        : AppTheme.primaryRed,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              _isConnected
                  ? 'Chat - Connected'
                  : _connecting
                      ? 'Chat - Connecting...'
                      : 'Chat - Disconnected',
            ),
            const Spacer(),
            GestureDetector(
              onTap: () => setState(() => _showLogs = !_showLogs),
              child: Icon(
                _showLogs ? Icons.visibility_rounded : Icons.visibility_off_rounded,
                size: 18,
                color: AppTheme.greyMedium,
              ),
            ),
          ],
        ),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: Column(
        children: [
          Expanded(child: _isConnected ? _buildConnectedView() : _buildConnectView()),
          if (_showLogs) _buildLogPanel(),
        ],
      ),
    );
  }

  Widget _buildLogPanel() {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.5),
        border: const Border(top: BorderSide(color: Color(0x2FFFFFFF))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            color: Colors.black.withValues(alpha: 0.3),
            child: Row(
              children: [
                const Icon(Icons.terminal_rounded, size: 14, color: AppTheme.greyMedium),
                const SizedBox(width: 6),
                Text(
                  'Debug Logs (${_logs.length})',
                  style: const TextStyle(color: AppTheme.greyMedium, fontSize: 11, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () => setState(() => _logs.clear()),
                  child: const Icon(Icons.clear_all_rounded, size: 16, color: AppTheme.greyMedium),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(8),
              itemCount: _logs.length,
              itemBuilder: (context, i) {
                final log = _logs[i];
                Color color = AppTheme.greyMedium;
                if (log.contains('✅')) color = AppTheme.emeraldGreen;
                if (log.contains('❌') || log.contains('⚠️') || log.contains('💥')) color = AppTheme.primaryRed;
                if (log.contains('📨') || log.contains('📤')) color = AppTheme.goldYellow;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 2),
                  child: Text(
                    log,
                    style: TextStyle(color: color, fontSize: 10, fontFamily: 'monospace'),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConnectView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 40),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.primaryRed.withValues(alpha: 0.1),
            ),
            child: const Icon(Icons.wifi_off_rounded, color: AppTheme.primaryRed, size: 40),
          ),
          const SizedBox(height: 24),
          Text(
            'Not Connected',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Paste your JWT token and tap Connect.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Server URL',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppTheme.greyMedium),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _serverUrlController,
                  style: const TextStyle(color: AppTheme.goldYellow, fontSize: 13, fontFamily: 'monospace'),
                  decoration: InputDecoration(
                    hintText: 'http://localhost:3000',
                    hintStyle: const TextStyle(color: AppTheme.greyMedium, fontSize: 13),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0x1FFFFFFF)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.goldYellow),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'JWT Auth Token',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppTheme.greyMedium),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _tokenController,
                  maxLines: 4,
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontFamily: 'monospace'),
                  decoration: InputDecoration(
                    hintText: 'Paste JWT token here',
                    hintStyle: const TextStyle(color: AppTheme.greyMedium, fontSize: 11),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0x1FFFFFFF)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.goldYellow),
                    ),
                  ),
                ),
                if (_token != null && _token!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.emeraldGreen.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_rounded, color: AppTheme.emeraldGreen, size: 14),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Token loaded (${_token!.substring(0, 12)}...${_token!.substring(_token!.length - 4)})',
                            style: const TextStyle(color: AppTheme.emeraldGreen, fontSize: 11, fontFamily: 'monospace'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _connecting ? null : _connect,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.goldYellow,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                      _connecting ? 'CONNECTING...' : 'CONNECT',
                      style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConnectedView() {
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.all(16).copyWith(bottom: 0),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: AppTheme.darkCardGradient,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x1FFFFFFF)),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Icon(Icons.wifi_rounded, color: AppTheme.emeraldGreen, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    'Connected',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: AppTheme.emeraldGreen,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: _disconnect,
                    style: TextButton.styleFrom(foregroundColor: AppTheme.primaryRed),
                    child: const Text('DISCONNECT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _chatIdController,
                      enabled: !_isJoined,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: InputDecoration(
                        labelText: 'Chat Room ID',
                        labelStyle: const TextStyle(color: AppTheme.greyMedium, fontSize: 13),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0x1FFFFFFF)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppTheme.goldYellow),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      onPressed: _toggleJoin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isJoined
                            ? AppTheme.primaryRed.withValues(alpha: 0.2)
                            : AppTheme.goldYellow,
                        foregroundColor: _isJoined ? AppTheme.primaryRed : Colors.black,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                        _isJoined ? 'LEAVE' : 'JOIN',
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (_isJoined) ...[
          Container(
            margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      hintStyle: const TextStyle(color: AppTheme.greyMedium),
                      border: InputBorder.none,
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                IconButton(
                  onPressed: _sendMessage,
                  icon: const Icon(Icons.send_rounded, color: AppTheme.goldYellow),
                ),
              ],
            ),
          ),
          const Divider(color: Color(0x1FFFFFFF), height: 1),
        ],
        Expanded(
          child: _messages.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.chat_bubble_outline_rounded,
                          color: AppTheme.greyMedium.withValues(alpha: 0.4), size: 48),
                      const SizedBox(height: 12),
                      Text(
                        _isJoined ? 'No messages yet' : 'Join a room',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _messages.length,
                  itemBuilder: (context, i) {
                    final msg = _messages[i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        gradient: AppTheme.darkCardGradient,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0x1FFFFFFF)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.goldYellow.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  msg.senderId.length > 10
                                      ? '${msg.senderId.substring(0, 10)}...'
                                      : msg.senderId,
                                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                        color: AppTheme.goldYellow,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 10,
                                      ),
                                ),
                              ),
                              const Spacer(),
                              Icon(
                                msg.isRead ? Icons.done_all_rounded : Icons.done_rounded,
                                color: msg.isRead ? AppTheme.emeraldGreen : AppTheme.greyMedium,
                                size: 14,
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(msg.content,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white)),
                          const SizedBox(height: 4),
                          Text(_formatTime(msg.createdAt),
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppTheme.greyMedium,
                                    fontSize: 10,
                                  )),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  String _formatTime(DateTime dt) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}
