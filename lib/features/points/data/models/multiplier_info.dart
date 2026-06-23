class MultiplierInfo {
  final String currentTier;
  final double currentMultiplier;
  final int lifetimePoints;
  final int? pointsToNextTier;
  final String? nextTier;
  final double? nextMultiplier;

  const MultiplierInfo({
    required this.currentTier,
    required this.currentMultiplier,
    required this.lifetimePoints,
    this.pointsToNextTier,
    this.nextTier,
    this.nextMultiplier,
  });

  factory MultiplierInfo.fromJson(Map<String, dynamic> json) {
    return MultiplierInfo(
      currentTier: json['currentTier'] as String? ?? 'bronze',
      currentMultiplier: (json['currentMultiplier'] as num?)?.toDouble() ?? 1.0,
      lifetimePoints: (json['lifetimePoints'] as num?)?.toInt() ?? 0,
      pointsToNextTier: (json['pointsToNextTier'] as num?)?.toInt(),
      nextTier: json['nextTier'] as String?,
      nextMultiplier: (json['nextMultiplier'] as num?)?.toDouble(),
    );
  }

  bool get isMaxTier => nextTier == null;

  double get progressToNextTier {
    if (isMaxTier) return 1.0;
    if (pointsToNextTier == null) return 0.0;
    final total = lifetimePoints + pointsToNextTier!;
    if (total <= 0) return 0.0;
    return lifetimePoints / total;
  }
}
