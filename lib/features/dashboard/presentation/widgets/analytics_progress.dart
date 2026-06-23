import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class AnalyticsProgress extends StatelessWidget {
  final double winRate;
  final int totalContestsJoined;
  final int totalContestsWon;
  final double averageRank;

  const AnalyticsProgress({
    super.key,
    required this.winRate,
    required this.totalContestsJoined,
    required this.totalContestsWon,
    required this.averageRank,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final winRatio = totalContestsJoined > 0
        ? totalContestsWon / totalContestsJoined
        : 0.0;
    final normalizedRank = averageRank > 0
        ? (1 - (averageRank - 1) / (100 - 1)).clamp(0.0, 1.0)
        : 0.0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildProgressRow(
            theme: theme,
            label: 'Win Rate',
            value: winRate / 100,
            display: '${winRate.toStringAsFixed(1)}%',
          ),
          const SizedBox(height: 14),
          _buildProgressRow(
            theme: theme,
            label: 'Contests Won',
            value: winRatio,
            display: '$totalContestsWon / $totalContestsJoined',
          ),
          const SizedBox(height: 14),
          _buildProgressRow(
            theme: theme,
            label: 'Average Rank',
            value: normalizedRank,
            display: averageRank.toStringAsFixed(1),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressRow({
    required ThemeData theme,
    required String label,
    required double value,
    required String display,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontSize: 12,
                color: AppTheme.greyMedium,
              ),
            ),
            Text(
              display,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: value.clamp(0.0, 1.0),
            minHeight: 6,
            backgroundColor: Colors.white.withValues(alpha: 0.08),
            valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryRed),
          ),
        ),
      ],
    );
  }
}
