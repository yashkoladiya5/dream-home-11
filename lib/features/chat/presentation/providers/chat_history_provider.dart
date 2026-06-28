import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/repositories/chat_history_repository.dart';
import '../../data/models/chat_detail_model.dart';
import '../../data/models/chat_list_models.dart';

final chatHistoryRepositoryProvider = Provider<ChatHistoryRepository>((ref) {
  final dio = ref.watch(apiClientProvider);
  return ChatHistoryRepository(dio);
});

final chatListProvider = FutureProvider<ChatListResponse>((ref) async {
  final repo = ref.watch(chatHistoryRepositoryProvider);
  return repo.getChats();
});

final chatDetailProvider = FutureProvider.family<ChatDetail, String>((ref, chatId) async {
  final repo = ref.watch(chatHistoryRepositoryProvider);
  return repo.getChatDetail(chatId);
});

final chatMessagesProvider =
    FutureProvider.family<ChatMessagesResponse, String>((ref, chatId) async {
  final repo = ref.watch(chatHistoryRepositoryProvider);
  return repo.getMessages(chatId);
});
