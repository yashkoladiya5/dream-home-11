class Reward {
  final String id;
  final String title;
  final String? description;
  final String? imageUrl;
  final int pointsRequired;
  final int? stock;
  final String category;
  final bool isActive;
  final int sortOrder;
  final DateTime createdAt;

  Reward({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl,
    required this.pointsRequired,
    this.stock,
    required this.category,
    required this.isActive,
    required this.sortOrder,
    required this.createdAt,
  });

  factory Reward.fromJson(Map<String, dynamic> json) {
    return Reward(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      pointsRequired: json['pointsRequired'] as int? ?? 0,
      stock: json['stock'] as int?,
      category: json['category'] as String? ?? 'gift_card',
      isActive: json['isActive'] as bool? ?? true,
      sortOrder: json['sortOrder'] as int? ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  bool get isOutOfStock {
    final s = stock;
    return s != null && s <= 0;
  }
}
