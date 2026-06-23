import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/multiplier_provider.dart';
import '../../../../features/dashboard/presentation/widgets/shimmer_widget.dart';

class MultiplierScreen extends ConsumerStatefulWidget {
  const MultiplierScreen({super.key});

  @override
  ConsumerState<MultiplierScreen> createState() => _MultiplierScreenState();
}

class _MultiplierScreenState extends ConsumerState<MultiplierScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(multiplierProvider.notifier).fetchMultiplierInfo());
  }

  @override
  Widget build(BuildContext context) {
    final multiplierState = ref.watch(multiplierProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Points Multiplier'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: multiplierState.when(
        data: (info) => RefreshIndicator(
          onRefresh: () => ref.read(multiplierProvider.notifier).fetchMultiplierInfo(),
          color: AppTheme.primaryRed,
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              children: [
                _buildTierHero(info),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      const SizedBox(height: 20),
                      _buildProgressCard(info),
                      const SizedBox(height: 20),
                      _buildTierLadder(info),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        loading: () => _buildShimmer(),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 48),
                const SizedBox(height: 16),
                Text(
                  'Failed to load multiplier info',
                  style: Theme.of(context).textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.read(multiplierProvider.notifier).fetchMultiplierInfo(),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _tierColor(String tier) {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return const Color(0xFFCD7F32);
      case 'silver':
        return const Color(0xFFC0C0C0);
      case 'gold':
        return AppTheme.goldYellow;
      case 'platinum':
        return const Color(0xFFE5E4E2);
      default:
        return AppTheme.greyMedium;
    }
  }

  LinearGradient _tierGradient(String tier) {
    final c = _tierColor(tier);
    return LinearGradient(
      colors: [c.withValues(alpha: 0.25), c.withValues(alpha: 0.05)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    );
  }

  IconData _tierIcon(String tier) {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return Icons.emoji_events_rounded;
      case 'silver':
        return Icons.emoji_events_rounded;
      case 'gold':
        return Icons.workspace_premium_rounded;
      case 'platinum':
        return Icons.diamond_rounded;
      default:
        return Icons.emoji_events_rounded;
    }
  }

  String _tierLabel(String tier) {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return 'BRONZE';
      case 'silver':
        return 'SILVER';
      case 'gold':
        return 'GOLD';
      case 'platinum':
        return 'PLATINUM';
      default:
        return tier.toUpperCase();
    }
  }

  Widget _buildTierHero(dynamic info) {
    final theme = Theme.of(context);
    final tier = info.currentTier as String;
    final multiplier = info.currentMultiplier as double;
    final color = _tierColor(tier);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: _tierGradient(tier),
        border: Border(
          bottom: BorderSide(color: color.withValues(alpha: 0.2)),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 28),
      child: Column(
        children: [
          Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withValues(alpha: 0.12),
              border: Border.all(color: color.withValues(alpha: 0.4), width: 2.5),
              boxShadow: [
                BoxShadow(
                  color: color.withValues(alpha: 0.25),
                  blurRadius: 20,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(_tierIcon(tier), color: color, size: 40),
          ),
          const SizedBox(height: 16),
          Text(
            '${multiplier.toStringAsFixed(multiplier == multiplier.roundToDouble() ? 0 : 1)}x',
            style: theme.textTheme.displayLarge?.copyWith(
              fontSize: 52,
              fontWeight: FontWeight.bold,
              color: color,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              _tierLabel(tier),
              style: theme.textTheme.labelLarge?.copyWith(
                color: color,
                letterSpacing: 2.5,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Points Multiplier',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: AppTheme.greyMedium,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressCard(dynamic info) {
    final theme = Theme.of(context);
    final lifetimePoints = info.lifetimePoints as int;
    final nextTier = info.nextTier as String?;
    final pointsToNextTier = info.pointsToNextTier as int?;
    final isMax = info.isMaxTier as bool;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppTheme.goldYellow.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.stars_rounded, color: AppTheme.goldYellow, size: 18),
              ),
              const SizedBox(width: 12),
              Text(
                'Lifetime Points',
                style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$lifetimePoints',
                style: theme.textTheme.displayLarge?.copyWith(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  height: 1,
                ),
              ),
              const SizedBox(width: 6),
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  'PTS',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: AppTheme.greyMedium,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          if (!isMax && nextTier != null && pointsToNextTier != null) ...[
            const SizedBox(height: 20),
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: (info.progressToNextTier as double).clamp(0.0, 1.0),
                    minHeight: 8,
                    backgroundColor: Colors.white.withValues(alpha: 0.08),
                    valueColor: AlwaysStoppedAnimation<Color>(_tierColor(nextTier)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$pointsToNextTier pts to ${_tierLabel(nextTier)}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: AppTheme.greyMedium,
                    fontSize: 12,
                  ),
                ),
                Text(
                  '${info.nextMultiplier}x',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: _tierColor(nextTier),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ] else ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.goldYellow.withValues(alpha: 0.15),
                    AppTheme.goldYellow.withValues(alpha: 0.05),
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.goldYellow.withValues(alpha: 0.2)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.workspace_premium_rounded, color: AppTheme.goldYellow, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    'MAXIMUM TIER REACHED',
                    style: theme.textTheme.labelLarge?.copyWith(
                      color: AppTheme.goldYellow,
                      fontSize: 11,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTierLadder(dynamic info) {
    final theme = Theme.of(context);
    final currentTier = info.currentTier as String;

    final tiers = [
      {'name': 'bronze', 'label': 'Bronze', 'multiplier': '1.0x', 'points': '0 PTS'},
      {'name': 'silver', 'label': 'Silver', 'multiplier': '1.1x', 'points': '1,000 PTS'},
      {'name': 'gold', 'label': 'Gold', 'multiplier': '1.25x', 'points': '2,000 PTS'},
      {'name': 'platinum', 'label': 'Platinum', 'multiplier': '1.5x', 'points': '5,000 PTS'},
    ];

    final currentIndex = _tierIndex(currentTier);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.emoji_events_rounded, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 12),
            Text(
              'Tier Ladder',
              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Stack(
          children: [
            Positioned(
              left: 18,
              top: 0,
              bottom: 0,
              child: Container(
                width: 2,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      _tierColor(tiers[0]['name'] as String).withValues(alpha: 0.4),
                      _tierColor(tiers[1]['name'] as String).withValues(alpha: 0.4),
                      _tierColor(tiers[2]['name'] as String).withValues(alpha: 0.4),
                      _tierColor(tiers[3]['name'] as String).withValues(alpha: 0.4),
                    ],
                    stops: const [0.0, 0.33, 0.66, 1.0],
                  ),
                ),
              ),
            ),
            Column(
              children: tiers.asMap().entries.map((entry) {
                final index = entry.key;
                final tier = entry.value;
                final isCurrent = tier['name'] == currentTier;
                final isUnlocked = index <= currentIndex;
                final tierColor = _tierColor(tier['name'] as String);

                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isCurrent
                              ? tierColor.withValues(alpha: 0.2)
                              : (isUnlocked ? tierColor.withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.04)),
                          border: Border.all(
                            color: isCurrent
                                ? tierColor.withValues(alpha: 0.6)
                                : (isUnlocked ? tierColor.withValues(alpha: 0.25) : Colors.white.withValues(alpha: 0.08)),
                            width: isCurrent ? 2.5 : 1.5,
                          ),
                          boxShadow: isCurrent
                              ? [BoxShadow(color: tierColor.withValues(alpha: 0.2), blurRadius: 10, offset: const Offset(0, 2))]
                              : null,
                        ),
                        child: Icon(
                          isUnlocked ? _tierIcon(tier['name'] as String) : Icons.lock_rounded,
                          color: isCurrent ? tierColor : (isUnlocked ? tierColor : AppTheme.greyMedium.withValues(alpha: 0.5)),
                          size: isCurrent ? 18 : 16,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: isCurrent
                                ? tierColor.withValues(alpha: 0.06)
                                : Colors.white.withValues(alpha: 0.03),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isCurrent
                                  ? tierColor.withValues(alpha: 0.2)
                                  : Colors.white.withValues(alpha: 0.05),
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          tier['label'] as String,
                                          style: theme.textTheme.titleMedium?.copyWith(
                                            fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
                                            color: isCurrent ? tierColor : (isUnlocked ? Colors.white : AppTheme.greyMedium),
                                            fontSize: 15,
                                          ),
                                        ),
                                        if (isCurrent) ...[
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: tierColor.withValues(alpha: 0.2),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              'ACTIVE',
                                              style: theme.textTheme.bodyMedium?.copyWith(
                                                color: tierColor,
                                                fontSize: 8,
                                                fontWeight: FontWeight.bold,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${tier['multiplier']}  •  ${tier['points']}',
                                      style: theme.textTheme.bodyMedium?.copyWith(
                                        fontSize: 11,
                                        color: isCurrent
                                            ? tierColor.withValues(alpha: 0.7)
                                            : (isUnlocked ? AppTheme.greyMedium : AppTheme.greyMedium.withValues(alpha: 0.5)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(
                                isCurrent
                                    ? Icons.check_circle_rounded
                                    : (isUnlocked ? Icons.check_circle_outline_rounded : Icons.lock_rounded),
                                color: isCurrent
                                    ? AppTheme.emeraldGreen
                                    : (isUnlocked ? tierColor.withValues(alpha: 0.5) : AppTheme.greyMedium.withValues(alpha: 0.3)),
                                size: 20,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ],
    );
  }

  int _tierIndex(String name) {
    switch (name) {
      case 'bronze':
        return 0;
      case 'silver':
        return 1;
      case 'gold':
        return 2;
      case 'platinum':
        return 3;
      default:
        return -1;
    }
  }

  Widget _buildShimmer() {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Column(
        children: [
          const SizedBox(height: 260),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                const ShimmerCard(height: 160, borderRadius: 16),
                const SizedBox(height: 16),
                const ShimmerCard(height: 280, borderRadius: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
