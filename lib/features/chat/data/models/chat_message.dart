class ChatMessage {
  final String id;
  final String chatId;
  final String senderId;
  final String? senderName;
  final String? senderAvatarUrl;
  final String content;
  final String type;
  final DateTime createdAt;
  final bool isRead;

  ChatMessage({
    required this.id,
    required this.chatId,
    required this.senderId,
    required this.content,
    required this.type,
    required this.createdAt,
    required this.isRead,
    this.senderName,
    this.senderAvatarUrl,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    String? senderName;
    String? senderAvatarUrl;
    final sender = json['sender'] as Map<String, dynamic>?;
    if (sender != null) {
      senderName = sender['fullName'] as String? ?? sender['name'] as String?;
      senderAvatarUrl = sender['avatarUrl'] as String?;
    }
    return ChatMessage(
      id: json['id'] as String? ?? '',
      chatId: json['chatId'] as String? ?? '',
      senderId: json['senderId'] as String? ?? '',
      senderName: senderName,
      senderAvatarUrl: senderAvatarUrl,
      content: json['content'] as String? ?? '',
      type: json['type'] as String? ?? 'text',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      isRead: json['isRead'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'chatId': chatId,
        'senderId': senderId,
        'senderName': senderName,
        'senderAvatarUrl': senderAvatarUrl,
        'content': content,
        'type': type,
        'createdAt': createdAt.toIso8601String(),
        'isRead': isRead,
      };
}
