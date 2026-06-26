class WalletSummary {
  final double totalCashDeposited;
  final double totalCashSpent;
  final int totalPointsEarned;
  final int totalPointsSpent;
  final double totalWithdrawn;

  const WalletSummary({
    required this.totalCashDeposited,
    required this.totalCashSpent,
    required this.totalPointsEarned,
    required this.totalPointsSpent,
    this.totalWithdrawn = 0.0,
  });

  double get netCash => totalCashDeposited - totalCashSpent - totalWithdrawn;
  int get netPoints => totalPointsEarned - totalPointsSpent;

  factory WalletSummary.fromJson(Map<String, dynamic> json) {
    return WalletSummary(
      totalCashDeposited: (json['totalCashDeposited'] as num?)?.toDouble() ?? 0.0,
      totalCashSpent: (json['totalCashSpent'] as num?)?.toDouble() ?? 0.0,
      totalPointsEarned: (json['totalPointsEarned'] as num?)?.toInt() ?? 0,
      totalPointsSpent: (json['totalPointsSpent'] as num?)?.toInt() ?? 0,
      totalWithdrawn: (json['totalWithdrawn'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
