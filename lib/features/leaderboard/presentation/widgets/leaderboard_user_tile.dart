import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/leaderboard_models.dart';

class LeaderboardUserTile extends StatelessWidget {
  final LeaderboardEntry entry;
  final bool isCurrentUser;
  final bool showRank;

  const LeaderboardUserTile({
    super.key,
    required this.entry,
    this.isCurrentUser = false,
    this.showRank = true,
  });

  Color get _tierColor {
    switch (entry.tierLabel) {
      case 'platinum':
        return AppTheme.emeraldGreen;
      case 'gold':
        return AppTheme.goldYellow;
      case 'silver':
        return Colors.cyan;
      default:
        return Colors.orange;
    }
  }

  String get _tierIcon {
    switch (entry.tierLabel) {
      case 'platinum':
        return '\u{1F48E}';
      case 'gold':
        return '\u{1F947}';
      case 'silver':
        return '\u{1F948}';
      default:
        return '\u{1F949}';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final medalColors = {1: AppTheme.goldYellow, 2: Colors.cyan, 3: Colors.orange};

    return Container(
      padding: const EdgeInsets.all(14),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        gradient: isCurrentUser
            ? const LinearGradient(colors: [Color(0x1AFF4B4B), Color(0x0CFFFFFF)])
            : AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isCurrentUser ? AppTheme.primaryRed.withValues(alpha: 0.5) : const Color(0x1FFFFFFF),
        ),
      ),
      child: Row(
        children: [
          if (showRank) ...[
            SizedBox(
              width: 40,
              child: Center(
                child: entry.rank <= 3
                    ? Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: (medalColors[entry.rank] ?? AppTheme.greyMedium).withValues(alpha: 0.2),
                        ),
                        child: Center(
                          child: Text(
                            '\u{1F3C6}',
                            style: TextStyle(fontSize: entry.rank == 1 ? 18 : 16),
                          ),
                        ),
                      )
                    : Text(
                        '#${entry.rank}',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: AppTheme.greyMedium,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [_tierColor.withValues(alpha: 0.3), _tierColor.withValues(alpha: 0.1)],
              ),
              border: Border.all(color: _tierColor.withValues(alpha: 0.5), width: 2),
            ),
            child: Center(
              child: Text(
                entry.initials,
                style: TextStyle(
                  color: _tierColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.fullName ?? 'Player',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: isCurrentUser ? AppTheme.primaryRed : AppTheme.white,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      _tierIcon,
                      style: const TextStyle(fontSize: 12),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      entry.currentTier?.toUpperCase() ?? 'BRONZE',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: _tierColor,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${entry.score.toInt()} pts',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.goldYellow,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
