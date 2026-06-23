class DailyAction {
  final String action;
  final String name;
  final String description;
  final int basePoints;
  final int dailyCap;
  final int todayCount;
  final bool canPerform;
  final String? reason;

  const DailyAction({
    required this.action,
    required this.name,
    required this.description,
    required this.basePoints,
    required this.dailyCap,
    required this.todayCount,
    required this.canPerform,
    this.reason,
  });

  factory DailyAction.fromJson(Map<String, dynamic> json) {
    return DailyAction(
      action: json['action'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      basePoints: (json['basePoints'] as num?)?.toInt() ?? 0,
      dailyCap: (json['dailyCap'] as num?)?.toInt() ?? 1,
      todayCount: (json['todayCount'] as num?)?.toInt() ?? 0,
      canPerform: json['canPerform'] as bool? ?? false,
      reason: json['reason'] as String?,
    );
  }

  int get remaining => dailyCap - todayCount;
  double get progress => dailyCap > 0 ? todayCount / dailyCap : 1.0;
  bool get isComplete => todayCount >= dailyCap;
}

class TodayActionsResponse {
  final List<DailyAction> actions;
  final int todayPoints;
  final int maxDailyPoints;

  const TodayActionsResponse({
    required this.actions,
    required this.todayPoints,
    required this.maxDailyPoints,
  });

  factory TodayActionsResponse.fromJson(Map<String, dynamic> json) {
    return TodayActionsResponse(
      actions: (json['actions'] as List<dynamic>?)
              ?.map((e) => DailyAction.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      todayPoints: (json['todayPoints'] as num?)?.toInt() ?? 0,
      maxDailyPoints: (json['maxDailyPoints'] as num?)?.toInt() ?? 0,
    );
  }

  double get overallProgress => maxDailyPoints > 0 ? todayPoints / maxDailyPoints : 0.0;
}

class PerformActionResult {
  final bool success;
  final String action;
  final int basePoints;
  final double multiplier;
  final int finalPoints;
  final int todayCount;
  final int dailyCap;
  final bool canPerform;
  final String? reason;
  final int lifetimePoints;
  final String currentTier;

  const PerformActionResult({
    required this.success,
    required this.action,
    required this.basePoints,
    required this.multiplier,
    required this.finalPoints,
    required this.todayCount,
    required this.dailyCap,
    required this.canPerform,
    this.reason,
    required this.lifetimePoints,
    required this.currentTier,
  });

  factory PerformActionResult.fromJson(Map<String, dynamic> json) {
    return PerformActionResult(
      success: json['success'] as bool? ?? false,
      action: json['action'] as String? ?? '',
      basePoints: (json['basePoints'] as num?)?.toInt() ?? 0,
      multiplier: (json['multiplier'] as num?)?.toDouble() ?? 1.0,
      finalPoints: (json['finalPoints'] as num?)?.toInt() ?? 0,
      todayCount: (json['todayCount'] as num?)?.toInt() ?? 0,
      dailyCap: (json['dailyCap'] as num?)?.toInt() ?? 0,
      canPerform: json['canPerform'] as bool? ?? false,
      reason: json['reason'] as String?,
      lifetimePoints: (json['lifetimePoints'] as num?)?.toInt() ?? 0,
      currentTier: json['currentTier'] as String? ?? 'bronze',
    );
  }
}
