import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class AchievementBadge extends StatelessWidget {
  final double winRate;
  final int totalContestsJoined;

  const AchievementBadge({
    super.key,
    required this.winRate,
    required this.totalContestsJoined,
  });

  String get _tier {
    if (winRate >= 50) return 'Top Tier';
    if (winRate >= 30) return 'Rising Star';
    if (winRate >= 10) return 'Active Player';
    return 'Challenger';
  }

  String get _record {
    if (winRate >= 50) return '${winRate.toStringAsFixed(0)}% Winning Record';
    if (winRate >= 30) return '${winRate.toStringAsFixed(0)}% Win Rate';
    return '$totalContestsJoined Contests Played';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B).withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
      ),
      child: Row(
        children: [
          Icon(
            Icons.emoji_events_rounded,
            color: AppTheme.greyMedium,
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Elite Performer',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$_tier  •  $_record',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontSize: 12,
                    color: AppTheme.greyMedium,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
