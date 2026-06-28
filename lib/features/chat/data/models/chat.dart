import 'chat_user.dart';
import 'chat_message.dart';

class Chat {
  final String id;
  final List<ChatUser> participants;
  final ChatMessage? lastMessage;
  final int unreadCount;

  Chat({
    required this.id,
    required this.participants,
    this.lastMessage,
    this.unreadCount = 0,
  });

  factory Chat.fromJson(Map<String, dynamic> json) {
    return Chat(
      id: json['id'] as String? ?? '',
      participants: (json['participants'] as List<dynamic>?)
              ?.map((e) => ChatUser.fromJson(e as Map<String, dynamic>))
              .toList() ?? [],
      lastMessage: json['lastMessage'] != null
          ? ChatMessage.fromJson(json['lastMessage'] as Map<String, dynamic>)
          : null,
      unreadCount: json['unreadCount'] as int? ?? 0,
    );
  }
}
