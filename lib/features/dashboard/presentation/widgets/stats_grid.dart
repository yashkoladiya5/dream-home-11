import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class StatsGrid extends StatelessWidget {
  final int totalContestsJoined;
  final int totalContestsWon;
  final int totalPointsEarned;
  final int totalEntryFeesSpent;

  const StatsGrid({
    super.key,
    required this.totalContestsJoined,
    required this.totalContestsWon,
    required this.totalPointsEarned,
    required this.totalEntryFeesSpent,
  });

  String _formatNumber(int number) {
    return number.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Wrap(
      runSpacing: 12,
      spacing: 12,
      children: [
        _StatCard(
          icon: Icons.sports_esports_rounded,
          value: _formatNumber(totalContestsJoined),
          label: 'Played',
          theme: theme,
        ),
        _StatCard(
          icon: Icons.emoji_events_rounded,
          value: _formatNumber(totalContestsWon),
          label: 'Won',
          theme: theme,
        ),
        _StatCard(
          icon: Icons.stars_rounded,
          value: _formatNumber(totalPointsEarned),
          label: 'Points',
          theme: theme,
        ),
        _StatCard(
          icon: Icons.monetization_on_rounded,
          value: _formatNumber(totalEntryFeesSpent),
          label: 'Fees',
          theme: theme,
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final ThemeData theme;

  const _StatCard({
    required this.icon,
    required this.value,
    required this.label,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
        width: ((MediaQuery.of(context).size.width - 32 - 12) / 2),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B).withValues(alpha: 0.5),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.06),
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AppTheme.greyMedium, size: 24),
          const SizedBox(height: 10),
          Text(
            value,
            textAlign: TextAlign.center,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontSize: 11,
              color: AppTheme.greyMedium,
            ),
          ),
        ],
      ),
    );
  }
}
