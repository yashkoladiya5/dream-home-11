class SupportTicket {
  final String id;
  final String subject;
  final String message;
  final String category;
  final String status;
  final String? attachmentUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  SupportTicket({
    required this.id,
    required this.subject,
    required this.message,
    this.category = 'general',
    this.status = 'open',
    this.attachmentUrl,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    return SupportTicket(
      id: json['id'] as String,
      subject: json['subject'] as String? ?? '',
      message: json['message'] as String? ?? '',
      category: json['category'] as String? ?? 'general',
      status: json['status'] as String? ?? 'open',
      attachmentUrl: json['attachmentUrl'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}
