import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class AnalyticsHeader extends StatelessWidget {
  final double winRate;
  final int totalContests;

  const AnalyticsHeader({
    super.key,
    required this.winRate,
    required this.totalContests,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.emoji_events_rounded, color: AppTheme.greyMedium, size: 22),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${winRate.round()}%',
                style: theme.textTheme.displayLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.trending_up_rounded, color: AppTheme.emeraldGreen, size: 18),
                  const SizedBox(width: 4),
                  Text(
                    '+${winRate.round()}%',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppTheme.emeraldGreen,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Win Rate',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppTheme.greyMedium,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Based on $totalContests ${totalContests == 1 ? 'Contest' : 'Contests'}',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppTheme.greyMedium,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
