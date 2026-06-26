class WithdrawRequest {
  final double amount;
  final String? bankAccountNumber;
  final String? bankIfsc;
  final String? bankName;
  final String? upiId;

  const WithdrawRequest({
    required this.amount,
    this.bankAccountNumber,
    this.bankIfsc,
    this.bankName,
    this.upiId,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{'amount': amount};
    if (bankAccountNumber != null) map['bankAccountNumber'] = bankAccountNumber;
    if (bankIfsc != null) map['bankIfsc'] = bankIfsc;
    if (bankName != null) map['bankName'] = bankName;
    if (upiId != null) map['upiId'] = upiId;
    return map;
  }
}

class WithdrawResponse {
  final String id;
  final double amount;
  final String status;
  final DateTime createdAt;

  const WithdrawResponse({
    required this.id,
    required this.amount,
    required this.status,
    required this.createdAt,
  });

  factory WithdrawResponse.fromJson(Map<String, dynamic> json) {
    return WithdrawResponse(
      id: json['id'] as String,
      amount: (json['amount'] as num).toDouble(),
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class WithdrawalRecord {
  final String id;
  final double amount;
  final String status;
  final String? bankAccountNumber;
  final String? bankName;
  final String? upiId;
  final String? utrNumber;
  final String? rejectionReason;
  final DateTime createdAt;

  const WithdrawalRecord({
    required this.id,
    required this.amount,
    required this.status,
    this.bankAccountNumber,
    this.bankName,
    this.upiId,
    this.utrNumber,
    this.rejectionReason,
    required this.createdAt,
  });

  factory WithdrawalRecord.fromJson(Map<String, dynamic> json) {
    return WithdrawalRecord(
      id: json['id'] as String,
      amount: (json['amount'] as num).toDouble(),
      status: json['status'] as String,
      bankAccountNumber: json['bankAccountNumber'] as String?,
      bankName: json['bankName'] as String?,
      upiId: json['upiId'] as String?,
      utrNumber: json['utrNumber'] as String?,
      rejectionReason: json['rejectionReason'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  String get statusLabel {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  }

  bool get isApproved => status == 'approved';
  bool get isPending => status == 'pending';
  bool get isRejected => status == 'rejected';
}

class WithdrawalHistory {
  final List<WithdrawalRecord> withdrawals;
  final int total;
  final int page;
  final int totalPages;

  const WithdrawalHistory({
    required this.withdrawals,
    required this.total,
    required this.page,
    required this.totalPages,
  });

  factory WithdrawalHistory.fromJson(Map<String, dynamic> json) {
    return WithdrawalHistory(
      withdrawals: (json['withdrawals'] as List)
          .map((e) => WithdrawalRecord.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int,
      page: json['page'] as int,
      totalPages: json['totalPages'] as int,
    );
  }
}
