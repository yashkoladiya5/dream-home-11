class ShareEvent {
  final String id;
  final String? contestId;
  final String shareChannel;
  final String status;
  final int pointsAwarded;
  final String? inviteCode;
  final DateTime sharedAt;

  const ShareEvent({
    required this.id,
    this.contestId,
    required this.shareChannel,
    required this.status,
    required this.pointsAwarded,
    this.inviteCode,
    required this.sharedAt,
  });

  factory ShareEvent.fromJson(Map<String, dynamic> json) {
    return ShareEvent(
      id: json['id'] as String,
      contestId: json['contestId'] as String?,
      shareChannel: json['shareChannel'] as String,
      status: json['status'] as String? ?? 'sent',
      pointsAwarded: (json['pointsAwarded'] as num?)?.toInt() ?? 0,
      inviteCode: json['inviteCode'] as String?,
      sharedAt: DateTime.parse(json['sharedAt'] as String),
    );
  }

  String get channelLabel {
    switch (shareChannel) {
      case 'whatsapp': return 'WhatsApp';
      case 'telegram': return 'Telegram';
      case 'sms': return 'SMS';
      case 'copy_link': return 'Copy Link';
      default: return shareChannel;
    }
  }
}
