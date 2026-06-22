import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../contests/data/models/contest_model.dart';
import '../../../contests/presentation/providers/contest_provider.dart';
import '../providers/user_profile_provider.dart';
import 'shimmer_widget.dart';

class ContestTab extends ConsumerWidget {
  const ContestTab({super.key});

  Future<void> _joinContest(
    BuildContext context,
    WidgetRef ref,
    ContestModel contest,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.secondarySlate,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          'Join Contest',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Do you want to join "${contest.title}"?\nEntry Fee: ₹${contest.entryFeeInr.toStringAsFixed(0)}\nYou will earn: ${contest.pointsToJoin} PTS',
          style: Theme.of(context).textTheme.bodyMedium,
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
            ),
            child: const Text('JOIN NOW', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final success = await ref.read(userProfileProvider.notifier).joinContest(
        contest.entryFeeInr,
        contest.pointsToJoin,
      );
      if (context.mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: AppTheme.emeraldGreen,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              content: Text(
                'Successfully joined "${contest.title}"! Registered for the contest.',
                style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.white),
              ),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: AppTheme.primaryRed,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              content: const Text(
                'Failed to join contest. Please check your wallet cash balance.',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.white),
              ),
            ),
          );
        }
      }
    }
  }

  Color _parseBadgeColor(String? hex) {
    if (hex == null) return AppTheme.primaryRed;
    final color = int.tryParse(hex.replaceFirst('#', '0xFF'));
    if (color == null) return AppTheme.primaryRed;
    return Color(color);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contestsAsync = ref.watch(contestListProvider);

    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutQuart,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 20 * (1 - value)),
            child: child,
          ),
        );
      },
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: contestsAsync.when(
            loading: () => _buildLoadingSkeleton(),
            error: (err, stack) => _buildErrorState(context, ref, err),
            data: (contests) {
              if (contests.isEmpty) {
                return _buildEmptyState(context);
              }
              return _buildContestList(context, ref, contests);
            },
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const ShimmerLine(width: 180, height: 28),
        const SizedBox(height: 8),
        const ShimmerLine(width: 240, height: 16),
        const SizedBox(height: 24),
        ...List.generate(3, (_) => const Padding(
          padding: EdgeInsets.only(bottom: 16),
          child: ShimmerCard(height: 180),
        )),
      ],
    );
  }

  Widget _buildErrorState(BuildContext context, WidgetRef ref, Object err) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 60),
        const Icon(Icons.cloud_off_rounded, size: 64, color: AppTheme.greyMedium),
        const SizedBox(height: 16),
        Text(
          'Could not load contests',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          'Check your connection and try again',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
        ),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: () => ref.read(contestListProvider.notifier).fetchContests(),
          icon: const Icon(Icons.refresh_rounded),
          label: const Text('RETRY'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryRed,
            foregroundColor: AppTheme.white,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 60),
        const Icon(Icons.emoji_events_outlined, size: 64, color: AppTheme.greyMedium),
        const SizedBox(height: 16),
        Text(
          'No contests available',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          'Check back later for new contests',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
        ),
      ],
    );
  }

  Widget _buildContestList(BuildContext context, WidgetRef ref, List<ContestModel> contests) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Active Contests',
          style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                fontWeight: FontWeight.w900,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'Join active contest groups to earn dream homes.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.greyMedium,
              ),
        ),
        const SizedBox(height: 24),
        ...contests.map((contest) => Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _buildContestCard(
            context,
            contest: contest,
            onJoin: () => _joinContest(context, ref, contest),
          ),
        )),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildContestCard(
    BuildContext context, {
    required ContestModel contest,
    required VoidCallback onJoin,
  }) {
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
                Text(
                  contest.title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
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
                    valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryRed),
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
                            color: AppTheme.primaryRed,
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
