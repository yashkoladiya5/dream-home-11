import 'chat_user.dart';

class ChatDetail {
  final String id;
  final String? name;
  final String type;
  final List<ChatDetailParticipant> participants;
  final ChatDetailLastMessage? lastMessage;
  final int unreadCount;
  final DateTime createdAt;

  ChatDetail({
    required this.id,
    this.name,
    required this.type,
    required this.participants,
    this.lastMessage,
    this.unreadCount = 0,
    required this.createdAt,
  });

  factory ChatDetail.fromJson(Map<String, dynamic> json) {
    return ChatDetail(
      id: json['id'] as String? ?? '',
      name: json['name'] as String?,
      type: json['type'] as String? ?? 'direct',
      participants: (json['participants'] as List<dynamic>?)
              ?.map((e) => ChatDetailParticipant.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      lastMessage: json['lastMessage'] != null
          ? ChatDetailLastMessage.fromJson(json['lastMessage'] as Map<String, dynamic>)
          : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}

class ChatDetailParticipant {
  final String id;
  final String fullName;
  final String? avatarUrl;
  final DateTime joinedAt;

  ChatDetailParticipant({
    required this.id,
    required this.fullName,
    this.avatarUrl,
    required this.joinedAt,
  });

  factory ChatDetailParticipant.fromJson(Map<String, dynamic> json) {
    return ChatDetailParticipant(
      id: json['id'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
      joinedAt: DateTime.tryParse(json['joinedAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}

class ChatDetailLastMessage {
  final String content;
  final DateTime createdAt;
  final String senderId;

  ChatDetailLastMessage({
    required this.content,
    required this.createdAt,
    required this.senderId,
  });

  factory ChatDetailLastMessage.fromJson(Map<String, dynamic> json) {
    return ChatDetailLastMessage(
      content: json['content'] as String? ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      senderId: json['senderId'] as String? ?? '',
    );
  }
}
