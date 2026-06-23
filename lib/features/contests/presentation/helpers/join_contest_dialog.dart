import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/contest_model.dart';

Future<bool?> showJoinConfirmationDialog(
  BuildContext context,
  ContestModel contest, {
  String? title,
}) {
  return showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      backgroundColor: AppTheme.secondarySlate,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: Text(
        title ?? 'Join Contest',
        style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '"${contest.title}"',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 16),
          _infoRow(context, Icons.account_balance_wallet_rounded, AppTheme.emeraldGreen,
              'Entry Fee: \u20B9${contest.entryFeeInr.toStringAsFixed(0)}'),
          const SizedBox(height: 8),
          _infoRow(context, Icons.stars_rounded, AppTheme.goldYellow,
              'You will earn: ${contest.pointsToJoin} PTS'),
          if (contest.prize != null) ...[
            const SizedBox(height: 8),
            _infoRow(context, Icons.emoji_events_rounded, AppTheme.primaryRed,
                'Prize: ${contest.prize}'),
          ],
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('CANCEL', style: TextStyle(color: AppTheme.greyMedium)),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(true),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.emeraldGreen,
            foregroundColor: AppTheme.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text('JOIN NOW', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      ],
    ),
  );
}

Widget _infoRow(BuildContext context, IconData icon, Color color, String text) {
  return Row(
    children: [
      Icon(icon, size: 16, color: color),
      const SizedBox(width: 8),
      Flexible(
        child: Text(
          text,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.greyLight,
              ),
          overflow: TextOverflow.ellipsis,
        ),
      ),
    ],
  );
}
