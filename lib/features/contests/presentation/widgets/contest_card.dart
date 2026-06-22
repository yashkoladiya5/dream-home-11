import 'package:flutter/material.dart';
import '../../data/models/contest_model.dart';
import '../../../../core/theme/app_theme.dart';

class ContestCard extends StatelessWidget {
  final ContestModel contest;
  final VoidCallback onJoin;
  final Color? accentColor;
  final Widget? titleIcon;

  const ContestCard({
    super.key,
    required this.contest,
    required this.onJoin,
    this.accentColor,
    this.titleIcon,
  });

  Color _parseBadgeColor(String? hex) {
    if (hex == null) return const Color(0xFFD22C2C);
    final color = int.tryParse(hex.replaceFirst('#', '0xFF'));
    if (color == null) return const Color(0xFFD22C2C);
    return Color(color);
  }

  @override
  Widget build(BuildContext context) {
    final badgeColor = _parseBadgeColor(contest.badgeColor);

    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 20.0, right: 20.0, top: 16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (contest.badgeText != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: badgeColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: badgeColor.withValues(alpha: 0.4), width: 1),
                    ),
                    child: Text(
                      contest.badgeText!,
                      style: TextStyle(
                        color: badgeColor,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.0,
                      ),
                    ),
                  )
                else
                  const SizedBox.shrink(),
                Text(
                  'Entry: ₹${contest.entryFeeInr.toStringAsFixed(0)}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.emeraldGreen,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (titleIcon != null) ...[
                      titleIcon!,
                      const SizedBox(width: 8),
                    ],
                    Expanded(
                      child: Text(
                        contest.title,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ),
                  ],
                ),
                if (contest.prize != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    contest.prize!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.greyLight,
                        ),
                  ),
                ],
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: Column(
              children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: contest.fillPercentage,
                      backgroundColor: AppTheme.greyDark,
                      valueColor: AlwaysStoppedAnimation<Color>(accentColor ?? AppTheme.primaryRed),
                      minHeight: 6,
                    ),
                  ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${contest.spotsLeft} spots left',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: accentColor ?? AppTheme.primaryRed,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      '${contest.maxSlots} total spots',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.greyMedium,
                            fontSize: 12,
                          ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          Container(
            height: 1,
            color: const Color(0x16FFFFFF),
          ),
          InkWell(
            onTap: onJoin,
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(24),
              bottomRight: Radius.circular(24),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16.0),
              child: Center(
                child: Text(
                  'JOIN CONTEST',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.white,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                        fontSize: 14,
                      ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
