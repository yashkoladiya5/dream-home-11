class PrizeHome {
  final String id;
  final String title;
  final String? description;
  final String? imageUrl;
  final String city;
  final String? state;
  final String? location;
  final num valueInr;
  final int? bedrooms;
  final int? bathrooms;
  final String? area;
  final List<String>? features;
  final String? type;
  final String? emoji;
  final int sortOrder;
  final bool isActive;
  final DateTime createdAt;

  const PrizeHome({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl,
    required this.city,
    this.state,
    this.location,
    required this.valueInr,
    this.bedrooms,
    this.bathrooms,
    this.area,
    this.features,
    this.type,
    this.emoji,
    this.sortOrder = 0,
    this.isActive = true,
    required this.createdAt,
  });

  String get formattedValue {
    if (valueInr >= 10000000) return '\u20B9${(valueInr / 10000000).toStringAsFixed(1)} Cr';
    if (valueInr >= 100000) return '\u20B9${(valueInr / 100000).toStringAsFixed(1)} Lakhs';
    return '\u20B9${valueInr.toStringAsFixed(0)}';
  }

  String get locationDisplay => state != null ? '$city, $state' : city;

  factory PrizeHome.fromJson(Map<String, dynamic> json) {
    return PrizeHome(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      city: json['city'] as String,
      state: json['state'] as String?,
      location: json['location'] as String?,
      valueInr: json['valueInr'] is String
          ? num.parse(json['valueInr'] as String)
          : json['valueInr'] as num,
      bedrooms: json['bedrooms'] as int?,
      bathrooms: json['bathrooms'] as int?,
      area: json['area'] as String?,
      features: json['features'] != null
          ? (json['features'] as List<dynamic>).cast<String>()
          : null,
      type: json['type'] as String?,
      emoji: json['emoji'] as String?,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
