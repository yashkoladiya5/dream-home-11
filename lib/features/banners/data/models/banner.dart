class BannerModel {
  final String id;
  final String title;
  final String? subtitle;
  final String? imageUrl;
  final String? link;
  final String? linkLabel;
  final String? backgroundColor;
  final int sortOrder;
  final bool isActive;
  final DateTime createdAt;

  BannerModel({
    required this.id,
    required this.title,
    this.subtitle,
    this.imageUrl,
    this.link,
    this.linkLabel,
    this.backgroundColor,
    required this.sortOrder,
    required this.isActive,
    required this.createdAt,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['id'] as String,
      title: json['title'] as String,
      subtitle: json['subtitle'] as String?,
      imageUrl: json['imageUrl'] as String?,
      link: json['link'] as String?,
      linkLabel: json['linkLabel'] as String?,
      backgroundColor: json['backgroundColor'] as String?,
      sortOrder: json['sortOrder'] as int? ?? 0,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
