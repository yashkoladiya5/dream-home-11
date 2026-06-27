class SpinResult {
  final bool success;
  final int segmentIndex;
  final int prizePoints;
  final String tier;
  final String message;
  final bool canSpinAgain;
  final String? nextAvailableSpin;

  SpinResult({
    required this.success,
    required this.segmentIndex,
    required this.prizePoints,
    required this.tier,
    required this.message,
    required this.canSpinAgain,
    this.nextAvailableSpin,
  });

  factory SpinResult.fromJson(Map<String, dynamic> json) {
    return SpinResult(
      success: json['success'] as bool? ?? false,
      segmentIndex: json['segmentIndex'] is String
          ? int.tryParse(json['segmentIndex'] as String) ?? 0
          : (json['segmentIndex'] as int? ?? 0),
      prizePoints: json['prizePoints'] is String
          ? int.tryParse(json['prizePoints'] as String) ?? 0
          : (json['prizePoints'] as int? ?? 0),
      tier: json['tier'] as String? ?? '',
      message: json['message'] as String? ?? '',
      canSpinAgain: json['canSpinAgain'] as bool? ?? false,
      nextAvailableSpin: json['nextAvailableSpin'] as String?,
    );
  }
}

class SpinStatus {
  final bool canSpin;
  final String? nextAvailableSpin;

  SpinStatus({required this.canSpin, this.nextAvailableSpin});

  factory SpinStatus.fromJson(Map<String, dynamic> json) {
    return SpinStatus(
      canSpin: json['canSpin'] as bool? ?? true,
      nextAvailableSpin: json['nextAvailableSpin'] as String?,
    );
  }
}

const List<int> segmentPrizes = [10, 12, 14, 15, 16, 18, 20];
