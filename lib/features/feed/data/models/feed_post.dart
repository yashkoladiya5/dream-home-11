class FeedPost {
  final String id;
  final String content;
  final String? imageUrl;
  final DateTime createdAt;
  final FeedUser user;
  final int likeCount;
  final int commentCount;
  final bool hasLiked;

  FeedPost({
    required this.id,
    required this.content,
    this.imageUrl,
    required this.createdAt,
    required this.user,
    required this.likeCount,
    required this.commentCount,
    required this.hasLiked,
  });

  factory FeedPost.fromJson(Map<String, dynamic> json) {
    return FeedPost(
      id: json['id'] as String,
      content: json['content'] as String,
      imageUrl: json['imageUrl'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      user: FeedUser.fromJson(json['user'] as Map<String, dynamic>),
      likeCount: json['likeCount'] as int? ?? 0,
      commentCount: json['commentCount'] as int? ?? 0,
      hasLiked: json['hasLiked'] as bool? ?? false,
    );
  }
}

class FeedUser {
  final String id;
  final String? fullName;
  final String? avatarUrl;
  final String? currentTier;

  FeedUser({
    required this.id,
    this.fullName,
    this.avatarUrl,
    this.currentTier,
  });

  factory FeedUser.fromJson(Map<String, dynamic> json) {
    return FeedUser(
      id: json['id'] as String,
      fullName: json['fullName'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      currentTier: json['currentTier'] as String?,
    );
  }
}
