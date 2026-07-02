import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/chat_repository.dart';
import '../../data/models/chat_message.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  final storage = ref.read(secureStorageProvider);
  final repo = ChatRepository();
  ref.onDispose(() => repo.dispose());

  storage.read(key: 'session_token').then((token) {
    if (token != null) {
      repo.connect(token);
    }
  });

  return repo;
});

final newMessageProvider = StreamProvider<ChatMessage>((ref) {
  final repo = ref.watch(chatRepositoryProvider);
  return repo.onNewMessage;
});

final chatConnectionStateProvider = StateProvider<bool>((ref) {
  final repo = ref.watch(chatRepositoryProvider);
  return repo.isConnected;
});

final chatConnectionProvider = StreamProvider<bool>((ref) {
  final repo = ref.watch(chatRepositoryProvider);
  return repo.onConnectionChange;
});

final typingIndicatorProvider = StreamProvider<Map<String, dynamic>>((ref) {
  final repo = ref.watch(chatRepositoryProvider);
  return repo.onUserTyping;
});

final readReceiptProvider = StreamProvider<Map<String, dynamic>>((ref) {
  final repo = ref.watch(chatRepositoryProvider);
  return repo.onMessageRead;
});

final chatLogProvider = StreamProvider<String>((ref) {
  final repo = ref.watch(chatRepositoryProvider);
  return repo.onLog;
});

final activeChatIdProvider = StateProvider<String?>((ref) => null);

final chatActionsProvider = Provider<ChatActions>((ref) {
  final repo = ref.watch(chatRepositoryProvider);
  return ChatActions(repo);
});

class ChatActions {
  final ChatRepository _repo;

  ChatActions(this._repo);

  void joinChat(String chatId) => _repo.joinChat(chatId);
  void leaveChat(String chatId) => _repo.leaveChat(chatId);

  void sendMessage({required String chatId, required String content, String type = 'text'}) {
    _repo.sendMessage(chatId: chatId, content: content, type: type);
  }

  void sendTyping({required String chatId, required bool isTyping}) {
    _repo.sendTyping(chatId: chatId, isTyping: isTyping);
  }

  void markRead({required String chatId, required String messageId}) {
    _repo.markRead(chatId: chatId, messageId: messageId);
  }
}
