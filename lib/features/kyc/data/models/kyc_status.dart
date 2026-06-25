class KycStatusModel {
  final String status; // 'unverified', 'pending', 'approved', 'rejected'
  final bool aadhaarVerified;
  final bool panVerified;
  final DateTime? verifiedAt;
  final String? rejectionReason;

  const KycStatusModel({
    required this.status,
    this.aadhaarVerified = false,
    this.panVerified = false,
    this.verifiedAt,
    this.rejectionReason,
  });

  bool get isApproved => status == 'approved';
  bool get isPending => status == 'pending';
  bool get isRejected => status == 'rejected';
  bool get isUnverified => status == 'unverified';

  factory KycStatusModel.fromJson(Map<String, dynamic> json) {
    return KycStatusModel(
      status: json['status'] as String? ?? 'unverified',
      aadhaarVerified: json['aadhaarVerified'] as bool? ?? false,
      panVerified: json['panVerified'] as bool? ?? false,
      verifiedAt: json['verifiedAt'] != null ? DateTime.parse(json['verifiedAt'] as String) : null,
      rejectionReason: json['rejectionReason'] as String?,
    );
  }
}

class KycSubmissionResponse {
  final String id;
  final String status;
  final DateTime? verifiedAt;

  const KycSubmissionResponse({
    required this.id,
    required this.status,
    this.verifiedAt,
  });

  factory KycSubmissionResponse.fromJson(Map<String, dynamic> json) {
    return KycSubmissionResponse(
      id: json['id'] as String,
      status: json['status'] as String,
      verifiedAt: json['verifiedAt'] != null ? DateTime.parse(json['verifiedAt'] as String) : null,
    );
  }
}
