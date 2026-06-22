import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/contest_model.dart';
import '../providers/contest_provider.dart';
import '../helpers/join_contest_dialog.dart';
import '../screens/contest_rules_screen.dart';
import '../screens/join_success_screen.dart';
import '../../../dashboard/data/models/user_profile.dart';
import '../../../dashboard/presentation/providers/user_profile_provider.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class OurContestsScreen extends ConsumerStatefulWidget {
  final String contestId;

  const OurContestsScreen({super.key, required this.contestId});

  @override
  ConsumerState<OurContestsScreen> createState() => _OurContestsScreenState();
}

class _OurContestsScreenState extends ConsumerState<OurContestsScreen> {
  Future<void> _joinContest(ContestModel contest) async {
    final result = await Navigator.of(context).push<String>(
      MaterialPageRoute(
        builder: (_) => ContestRulesScreen(
          contest: contest,
          onAgreed: () => Navigator.of(context).pop('confirmed'),
        ),
      ),
    );

    if (result == 'confirmed' && context.mounted) {
      final confirmed = await showJoinConfirmationDialog(context, contest);
      if (confirmed == true && context.mounted) {
        final joinResult = await ref.read(userProfileProvider.notifier).joinContestById(contest.id);
        if (context.mounted) {
          if (joinResult != null) {
            final userData = UserProfile.fromJson(joinResult['user'] as Map<String, dynamic>);
            ref.read(contestListProvider.notifier).updateContestAfterJoin(contest.id);
            await Navigator.of(context).pushReplacement(
              MaterialPageRoute(
                builder: (_) => JoinSuccessScreen(
                  contest: contest,
                  updatedProfile: userData,
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
                  'Failed to join contest. Please check your wallet balance.',
                  style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.white),
                ),
              ),
            );
          }
        }
      }
    }
  }

  static const _months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  String _formatDate(DateTime dt) {
    return '${_months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'running':
        return AppTheme.emeraldGreen;
      case 'upcoming':
        return AppTheme.goldYellow;
      case 'completed':
        return Colors.blueAccent;
      default:
        return AppTheme.greyMedium;
    }
  }

  String _statusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'running':
        return 'LIVE';
      case 'upcoming':
        return 'UPCOMING';
      case 'completed':
        return 'COMPLETED';
      default:
        return status.toUpperCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    final contestsAsync = ref.watch(contestListProvider);
    final foundContest = contestsAsync.whenOrNull(
      data: (contests) => contests.where((c) => c.id == widget.contestId).firstOrNull,
    );

    final title = foundContest?.title ?? 'Contest Details';

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
      ),
      body: contestsAsync.when(
        loading: () => _buildLoadingSkeleton(),
        error: (err, stack) => _buildErrorState(err),
        data: (contests) {
          final contest = contests.where((c) => c.id == widget.contestId).firstOrNull;
          if (contest == null) {
            return _buildNotFoundState();
          }
          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildHeroPrizeSection(contest),
                      const SizedBox(height: 20),
                      _buildStatsSection(contest),
                      const SizedBox(height: 20),
                      _buildDurationSection(contest),
                      const SizedBox(height: 20),
                      _buildStatusBadge(contest),
                      const SizedBox(height: 20),
                      _buildRulesLink(contest),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
              _buildJoinButton(contest),
            ],
          );
        },
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const ShimmerCard(height: 180),
            const SizedBox(height: 20),
            const ShimmerCard(height: 100),
            const SizedBox(height: 20),
            const ShimmerLine(width: 200, height: 20),
            const SizedBox(height: 12),
            const ShimmerLine(width: 160, height: 16),
            const SizedBox(height: 20),
            const ShimmerLine(width: 120, height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(Object err) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_rounded, size: 64, color: AppTheme.greyMedium),
            const SizedBox(height: 16),
            Text(
              'Could not load contest details',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              err.toString(),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
              textAlign: TextAlign.center,
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
        ),
      ),
    );
  }

  Widget _buildNotFoundState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search_off_rounded, size: 64, color: AppTheme.greyMedium),
            const SizedBox(height: 16),
            Text(
              'Contest Not Found',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'The contest you\'re looking for doesn\'t exist or has been removed.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.arrow_back_rounded),
              label: const Text('GO BACK'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryRed,
                foregroundColor: AppTheme.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroPrizeSection(ContestModel contest) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  contest.title,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                if (contest.prize != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    contest.prize!,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: AppTheme.goldYellow,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ],
                if (contest.badgeText != null) ...[
                  const SizedBox(height: 16),
                  _buildBadge(contest),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(ContestModel contest) {
    final badgeColor = _parseBadgeColor(contest.badgeColor);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: badgeColor.withValues(alpha: 0.4), width: 1),
      ),
      child: Text(
        contest.badgeText!,
        style: TextStyle(
          color: badgeColor,
          fontSize: 12,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.0,
        ),
      ),
    );
  }

  Color _parseBadgeColor(String? hex) {
    if (hex == null) return AppTheme.primaryRed;
    final color = int.tryParse(hex.replaceFirst('#', '0xFF'));
    if (color == null) return AppTheme.primaryRed;
    return Color(color);
  }

  Widget _buildStatsSection(ContestModel contest) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    context,
                    label: 'Entry Fee',
                    value: '\u20B9${contest.entryFeeInr.toStringAsFixed(0)}',
                    icon: Icons.account_balance_wallet_rounded,
                    color: AppTheme.emeraldGreen,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    context,
                    label: 'Points to Join',
                    value: '${contest.pointsToJoin} PTS',
                    icon: Icons.stars_rounded,
                    color: AppTheme.goldYellow,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    context,
                    label: 'Total Slots',
                    value: '${contest.maxSlots}',
                    icon: Icons.groups_rounded,
                    color: AppTheme.greyLight,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    context,
                    label: 'Filled',
                    value: '${contest.filledSlots}',
                    icon: Icons.person_rounded,
                    color: AppTheme.primaryRed,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: contest.fillPercentage,
                backgroundColor: AppTheme.greyDark,
                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryRed),
                minHeight: 8,
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
                  '${(contest.fillPercentage * 100).toStringAsFixed(0)}% filled',
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
    );
  }

  Widget _buildStatItem(
    BuildContext context, {
    required String label,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.greyMedium,
                    fontSize: 12,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: color,
                fontWeight: FontWeight.bold,
              ),
        ),
      ],
    );
  }

  Widget _buildDurationSection(ContestModel contest) {
    final startStr = _formatDate(contest.startTime);
    final endStr = _formatDate(contest.endTime);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Duration',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppTheme.greyMedium,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.play_circle_outline_rounded, size: 20, color: AppTheme.emeraldGreen),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Starts',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.greyMedium,
                            fontSize: 12,
                          ),
                    ),
                    Text(
                      startStr,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                const Icon(Icons.stop_circle_outlined, size: 20, color: AppTheme.primaryRed),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Ends',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.greyMedium,
                            fontSize: 12,
                          ),
                    ),
                    Text(
                      endStr,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(ContestModel contest) {
    final color = _statusColor(contest.status);
    final label = _statusLabel(contest.status);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Row(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: color.withValues(alpha: 0.4),
                    blurRadius: 8,
                    spreadRadius: 2,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),
            Text(
              label,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: color,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRulesLink(ContestModel contest) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ContestRulesScreen(
              contest: contest,
              onAgreed: () => Navigator.of(context).pop(),
            ),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          gradient: AppTheme.darkCardGradient,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0x1FFFFFFF)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppTheme.primaryRed.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.description_outlined, color: AppTheme.primaryRed, size: 18),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Rules & Terms',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    Text(
                      'Tap to view contest rules and conditions',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.greyMedium,
                            fontSize: 12,
                          ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppTheme.greyMedium),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildJoinButton(ContestModel contest) {
    final isRunning = contest.status == 'running';
    final alreadyJoined = ref.read(contestListProvider.notifier).isJoined(contest.id);

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.darkSlate.withValues(alpha: 0),
            AppTheme.darkSlate,
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: alreadyJoined
            ? Container(
                decoration: BoxDecoration(
                  color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppTheme.emeraldGreen.withValues(alpha: 0.4),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.check_circle_rounded, color: AppTheme.emeraldGreen, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      'ALREADY JOINED',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppTheme.emeraldGreen,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.0,
                          ),
                    ),
                  ],
                ),
              )
            : ElevatedButton(
                onPressed: isRunning ? () => _joinContest(contest) : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: isRunning ? AppTheme.emeraldGreen : AppTheme.greyDark,
                  foregroundColor: AppTheme.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: isRunning ? 4 : 0,
                  shadowColor: isRunning ? AppTheme.emeraldGreen.withValues(alpha: 0.4) : null,
                ),
                child: Text(
                  isRunning
                      ? 'JOIN CONTEST - \u20B9${contest.entryFeeInr.toStringAsFixed(0)}'
                      : contest.status == 'completed'
                          ? 'CONTEST ENDED'
                          : 'COMING SOON',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                      ),
                ),
              ),
      ),
    );
  }
}
