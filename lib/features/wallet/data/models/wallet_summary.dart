class WalletSummary {
  final double totalCashDeposited;
  final double totalCashSpent;
  final int totalPointsEarned;
  final int totalPointsSpent;

  const WalletSummary({
    this.totalCashDeposited = 0,
    this.totalCashSpent = 0,
    this.totalPointsEarned = 0,
    this.totalPointsSpent = 0,
  });

  double get netCash => totalCashDeposited - totalCashSpent;
  int get netPoints => totalPointsEarned - totalPointsSpent;

  factory WalletSummary.fromJson(Map<String, dynamic> json) {
    return WalletSummary(
      totalCashDeposited: (json['totalCashDeposited'] as num?)?.toDouble() ?? 0,
      totalCashSpent: (json['totalCashSpent'] as num?)?.toDouble() ?? 0,
      totalPointsEarned: (json['totalPointsEarned'] as num?)?.toInt() ?? 0,
      totalPointsSpent: (json['totalPointsSpent'] as num?)?.toInt() ?? 0,
    );
  }
}
