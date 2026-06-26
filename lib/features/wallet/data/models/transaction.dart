class TransactionModel {
  final String id;
  final String userId;
  final String type;
  final double cashAmount;
  final int pointsAmount;
  final double? cashBalanceBefore;
  final double? cashBalanceAfter;
  final int? pointsBalanceBefore;
  final int? pointsBalanceAfter;
  final String? description;
  final String? referenceType;
  final String? referenceId;
  final String status;
  final DateTime createdAt;

  const TransactionModel({
    required this.id,
    required this.userId,
    required this.type,
    this.cashAmount = 0,
    this.pointsAmount = 0,
    this.cashBalanceBefore,
    this.cashBalanceAfter,
    this.pointsBalanceBefore,
    this.pointsBalanceAfter,
    this.description,
    this.referenceType,
    this.referenceId,
    this.status = 'completed',
    required this.createdAt,
  });

  String get typeLabel {
    switch (type) {
      case 'deposit':
        return 'Cash Deposit';
      case 'entry_fee':
        return 'Contest Entry';
      case 'withdrawal':
        return 'Withdrawal';
      case 'redemption':
        return 'Reward Redemption';
      case 'points_earned':
        return 'Points Earned';
      case 'points_bonus':
        return 'Bonus Points';
      case 'referral':
        return 'Referral Reward';
      default:
        return type.replaceAll('_', ' ').split(' ').map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '').join(' ');
    }
  }

  bool get isCredit => cashAmount > 0 || pointsAmount > 0;

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
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

    double? toDoubleNull(dynamic v) {
      if (v == null) return null;
      if (v is String) return double.tryParse(v);
      return (v as num).toDouble();
    }

    int? toIntNull(dynamic v) {
      if (v == null) return null;
      if (v is String) return int.tryParse(v);
      return (v as num).toInt();
    }

    return TransactionModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: json['type'] as String,
      cashAmount: toDouble(json['cashAmount']),
      pointsAmount: toInt(json['pointsAmount']),
      cashBalanceBefore: toDoubleNull(json['cashBalanceBefore']),
      cashBalanceAfter: toDoubleNull(json['cashBalanceAfter']),
      pointsBalanceBefore: toIntNull(json['pointsBalanceBefore']),
      pointsBalanceAfter: toIntNull(json['pointsBalanceAfter']),
      description: json['description'] as String?,
      referenceType: json['referenceType'] as String?,
      referenceId: json['referenceId'] as String?,
      status: json['status'] as String? ?? 'completed',
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
