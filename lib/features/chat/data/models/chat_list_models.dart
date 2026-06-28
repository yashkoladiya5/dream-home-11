import 'chat_user.dart';
import 'chat_message.dart';

class ChatListItem {
  final String id;
  final String? name;
  final String type;
  final List<ChatUser> participants;
  final ChatMessagePreview? lastMessage;
  final int unreadCount;
  final DateTime createdAt;

  ChatListItem({
    required this.id,
    this.name,
    required this.type,
    required this.participants,
    this.lastMessage,
    this.unreadCount = 0,
    required this.createdAt,
  });

  factory ChatListItem.fromJson(Map<String, dynamic> json) {
    return ChatListItem(
      id: json['id'] as String? ?? '',
      name: json['name'] as String?,
      type: json['type'] as String? ?? 'direct',
      participants: (json['participants'] as List<dynamic>?)
              ?.map((e) => ChatUser.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      lastMessage: json['lastMessage'] != null
          ? ChatMessagePreview.fromJson(json['lastMessage'] as Map<String, dynamic>)
          : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}

class ChatMessagePreview {
  final String content;
  final DateTime createdAt;
  final String senderId;

  ChatMessagePreview({
    required this.content,
    required this.createdAt,
    required this.senderId,
  });

  factory ChatMessagePreview.fromJson(Map<String, dynamic> json) {
    return ChatMessagePreview(
      content: json['content'] as String? ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      senderId: json['senderId'] as String? ?? '',
    );
  }
}

class ChatMessagesResponse {
  final List<ChatMessage> data;
  final ChatMeta meta;

  ChatMessagesResponse({required this.data, required this.meta});

  factory ChatMessagesResponse.fromJson(Map<String, dynamic> json) {
    return ChatMessagesResponse(
      data: (json['data'] as List<dynamic>?)
              ?.map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      meta: ChatMeta.fromJson(json['meta'] as Map<String, dynamic>? ?? {}),
    );
  }
}

class ChatMeta {
  final int total;
  final int page;
  final int limit;
  final bool hasMore;

  ChatMeta({
    required this.total,
    required this.page,
    required this.limit,
    required this.hasMore,
  });

  factory ChatMeta.fromJson(Map<String, dynamic> json) {
    return ChatMeta(
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 30,
      hasMore: json['hasMore'] as bool? ?? false,
    );
  }
}

class ChatListResponse {
  final List<ChatListItem> data;

  ChatListResponse({required this.data});

  factory ChatListResponse.fromJson(dynamic json) {
    if (json is List) {
      return ChatListResponse(
        data: json.map((e) => ChatListItem.fromJson(e as Map<String, dynamic>)).toList(),
      );
    }
    final map = json as Map<String, dynamic>;
    return ChatListResponse(
      data: (map['data'] as List<dynamic>?)
              ?.map((e) => ChatListItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
