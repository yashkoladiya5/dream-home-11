import 'package:dio/dio.dart';
import '../models/chat_detail_model.dart';
import '../models/chat_list_models.dart';

class ChatHistoryRepository {
  final Dio _dio;

  ChatHistoryRepository(this._dio);

  Future<ChatListResponse> getChats() async {
    final response = await _dio.get('/api/v1/chats');
    return ChatListResponse.fromJson(response.data);
  }

  Future<ChatDetail> getChatDetail(String chatId) async {
    final response = await _dio.get('/api/v1/chats/$chatId');
    return ChatDetail.fromJson(response.data as Map<String, dynamic>);
  }

  Future<ChatMessagesResponse> getMessages(String chatId, {int page = 1, int limit = 30}) async {
    final response = await _dio.get(
      '/api/v1/chats/$chatId/messages',
      queryParameters: {'page': page, 'limit': limit},
    );
    return ChatMessagesResponse.fromJson(response.data);
  }
}
