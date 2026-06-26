import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/leaderboard_provider.dart';

class LeaderboardBadge extends ConsumerWidget {
  const LeaderboardBadge({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lbAsync = ref.watch(leaderboardProvider);

    return lbAsync.when(
      data: (response) {
        final userRank = response.userRank;
        if (userRank == null) return const SizedBox.shrink();

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.leaderboard_rounded, color: Colors.white, size: 14),
              const SizedBox(width: 4),
              Text(
                '#${userRank.rank}',
                style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, _) => const SizedBox.shrink(),
    );
  }
}
