import 'package:flutter/material.dart';

class Achievement {
  final String id;
  final String key;
  final String title;
  final String? description;
  final String? icon;
  final int bonusPoints;
  final int sortOrder;
  final bool earned;
  final DateTime? earnedAt;

  Achievement({
    required this.id,
    required this.key,
    required this.title,
    this.description,
    this.icon,
    required this.bonusPoints,
    required this.sortOrder,
    required this.earned,
    this.earnedAt,
  });

  factory Achievement.fromJson(Map<String, dynamic> json) {
    return Achievement(
      id: json['id'] as String,
      key: json['key'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      icon: json['icon'] as String?,
      bonusPoints: json['bonusPoints'] as int? ?? 0,
      sortOrder: json['sortOrder'] as int? ?? 0,
      earned: json['earned'] as bool? ?? false,
      earnedAt: json['earnedAt'] != null ? DateTime.parse(json['earnedAt'] as String) : null,
    );
  }

  IconData get iconData {
    switch (key) {
      case 'first_contest': return Icons.emoji_events_rounded;
      case 'ten_contests': return Icons.military_tech_rounded;
      case 'fifty_contests': return Icons.workspace_premium_rounded;
      case 'streak_7': return Icons.local_fire_department_rounded;
      case 'streak_30': return Icons.whatshot_rounded;
      case 'share_first': return Icons.share_rounded;
      case 'share_ten': return Icons.groups_rounded;
      case 'points_5000': return Icons.stars_rounded;
      case 'points_10000': return Icons.auto_awesome_rounded;
      case 'first_redeem': return Icons.card_giftcard_rounded;
      default: return Icons.emoji_events_rounded;
    }
  }
}
