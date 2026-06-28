class ChatUser {
  final String id;
  final String fullName;
  final String? avatarUrl;

  ChatUser({required this.id, required this.fullName, this.avatarUrl});

  factory ChatUser.fromJson(Map<String, dynamic> json) {
    return ChatUser(
      id: json['id'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
    );
  }
}
