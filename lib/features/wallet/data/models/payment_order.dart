class PaymentOrder {
  final String orderId;
  final double amount;
  final String status;

  const PaymentOrder({
    required this.orderId,
    required this.amount,
    required this.status,
  });

  factory PaymentOrder.fromJson(Map<String, dynamic> json) {
    double toDouble(dynamic v) {
      if (v == null) return 0;
      if (v is String) return double.tryParse(v) ?? 0;
      return (v as num).toDouble();
    }

    return PaymentOrder(
      orderId: json['orderId'] as String,
      amount: toDouble(json['amount']),
      status: json['status'] as String? ?? 'pending',
    );
  }
}

class PaymentVerification {
  final bool success;
  final String orderId;
  final String? paymentId;
  final double amount;
  final int bonusPoints;
  final double walletBalance;
  final int pointsBalance;

  const PaymentVerification({
    required this.success,
    required this.orderId,
    this.paymentId,
    required this.amount,
    this.bonusPoints = 0,
    required this.walletBalance,
    required this.pointsBalance,
  });

  factory PaymentVerification.fromJson(Map<String, dynamic> json) {
    double toDouble(dynamic v) {
      if (v == null) return 0;
      if (v is String) return double.tryParse(v) ?? 0;
      return (v as num).toDouble();
    }

    int toInt(dynamic v) {
      if (v == null) return 0;
      if (v is String) return int.tryParse(v) ?? 0;
      return (v as num).toInt();
    }

    return PaymentVerification(
      success: json['success'] as bool? ?? false,
      orderId: json['orderId'] as String,
      paymentId: json['paymentId'] as String?,
      amount: toDouble(json['amount']),
      bonusPoints: toInt(json['bonusPoints']),
      walletBalance: toDouble(json['walletBalance']),
      pointsBalance: toInt(json['pointsBalance']),
    );
  }
}
