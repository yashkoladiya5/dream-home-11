class CompensationLog {
  final String id;
  final String? contestId;
  final String? contestTitle;
  final double entryFeeInr;
  final int compensationPoints;
  final String status;
  final DateTime? processedAt;
  final DateTime createdAt;

  CompensationLog({
    required this.id,
    this.contestId,
    this.contestTitle,
    required this.entryFeeInr,
    required this.compensationPoints,
    required this.status,
    this.processedAt,
    required this.createdAt,
  });

  factory CompensationLog.fromJson(Map<String, dynamic> json) {
    return CompensationLog(
      id: json['id'] as String,
      contestId: json['contestId'] as String?,
      contestTitle: json['contestTitle'] as String?,
      entryFeeInr: (json['entryFeeInr'] as num?)?.toDouble() ?? 0.0,
      compensationPoints: json['compensationPoints'] as int? ?? 0,
      status: json['status'] as String? ?? 'pending',
      processedAt: json['processedAt'] != null
          ? DateTime.tryParse(json['processedAt'] as String)
          : null,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}
