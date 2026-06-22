import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/contest_model.dart';
import '../providers/contest_provider.dart';
import '../helpers/join_contest_dialog.dart';
import '../screens/contest_rules_screen.dart';
import '../screens/join_success_screen.dart';
import '../../../dashboard/data/models/user_profile.dart';
import '../../../dashboard/presentation/providers/user_profile_provider.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class MegaContestScreen extends ConsumerStatefulWidget {
  const MegaContestScreen({super.key});

  @override
  ConsumerState<MegaContestScreen> createState() => _MegaContestScreenState();
}

class _MegaContestScreenState extends ConsumerState<MegaContestScreen> {
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
      final confirmed = await showJoinConfirmationDialog(context, contest, title: 'Join Mega Contest');
      if (confirmed == true && context.mounted) {
        final joinResult = await ref.read(userProfileProvider.notifier).joinContestById(contest.id);
        if (context.mounted) {
          if (joinResult != null) {
            final userData = UserProfile.fromJson(joinResult['user'] as Map<String, dynamic>);
            ref.read(contestListProvider.notifier).updateContestAfterJoin(contest.id);
            await Navigator.of(context).push(
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

  @override
  Widget build(BuildContext context) {
    final contestsAsync = ref.watch(contestListProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      body: contestsAsync.when(
        loading: () => _buildShimmer(),
        error: (error, _) => _buildError(
          () => ref.read(contestListProvider.notifier).fetchContests(),
        ),
        data: (contests) {
          final megaContests = contests.where((c) => c.type == 'mega').toList();
          if (megaContests.isEmpty) {
            return _buildEmpty();
          }
          final featured = megaContests.first;
          final remaining = megaContests.length > 1 ? megaContests.sublist(1) : <ContestModel>[];
          return _buildContent(featured, remaining);
        },
      ),
    );
  }

  Widget _buildContent(ContestModel featured, List<ContestModel> remaining) {
    return RefreshIndicator(
      onRefresh: () => ref.read(contestListProvider.notifier).fetchContests(),
      backgroundColor: AppTheme.secondarySlate,
      color: AppTheme.goldYellow,
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildHeaderSection(),
            _buildFeaturedCard(featured),
            if (remaining.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                child: Row(
                  children: [
                    Container(
                      width: 4,
                      height: 20,
                      decoration: BoxDecoration(
                        gradient: AppTheme.goldGradient,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'ALL MEGA CONTESTS',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: AppTheme.goldYellow,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                          ),
                    ),
                    const Spacer(),
                    Text(
                      '${remaining.length} available',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.greyMedium,
                            fontSize: 12,
                          ),
                    ),
                  ],
                ),
              ),
              ...List.generate(remaining.length, (index) {
                final contest = remaining[index];
                return TweenAnimationBuilder<double>(
                  tween: Tween<double>(begin: 0.0, end: 1.0),
                  duration: Duration(milliseconds: 400 + (index * 100)),
                  curve: Curves.easeOutCubic,
                  builder: (context, value, child) {
                    return Opacity(
                      opacity: value,
                      child: Transform.translate(
                        offset: Offset(0, 30 * (1 - value)),
                        child: child,
                      ),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                    child: _buildMegaContestCard(contest),
                  ),
                );
              }),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderSection() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.darkSlate,
            AppTheme.secondarySlate.withValues(alpha: 0.5),
            AppTheme.darkSlate,
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 20,
        left: 24,
        right: 24,
        bottom: 24,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  gradient: AppTheme.goldGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.workspace_premium_rounded, color: AppTheme.white, size: 22),
              ),
              const SizedBox(width: 14),
              Text(
                'MEGA CONTESTS',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.0,
                      foreground: Paint()
                        ..shader = AppTheme.goldGradient.createShader(
                          const Rect.fromLTWH(0, 0, 300, 40),
                        ),
                    ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Compete for the grand prize in our premium mega contests',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppTheme.greyMedium,
                  fontSize: 14,
                ),
          ),
          const SizedBox(height: 20),
          Container(
            height: 2,
            decoration: BoxDecoration(
              gradient: AppTheme.goldGradient,
              borderRadius: BorderRadius.circular(1),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.goldYellow.withValues(alpha: 0.4),
                  blurRadius: 8,
                  spreadRadius: 1,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturedCard(ContestModel contest) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      child: TweenAnimationBuilder<double>(
        tween: Tween<double>(begin: 0.0, end: 1.0),
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeOutCubic,
        builder: (context, value, child) {
          return Opacity(
            opacity: value,
            child: Transform.translate(
              offset: Offset(0, 40 * (1 - value)),
              child: child,
            ),
          );
        },
        child: GestureDetector(
          onTap: () => context.push('/contest/${contest.id}'),
          child: Container(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1A1F2E), Color(0xFF0F1623)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: AppTheme.goldYellow.withValues(alpha: 0.3),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.goldYellow.withValues(alpha: 0.08),
                blurRadius: 24,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Stack(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                gradient: AppTheme.goldGradient,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.star_rounded, size: 14, color: AppTheme.white),
                                  const SizedBox(width: 4),
                                  Text(
                                    'FEATURED',
                                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                          color: AppTheme.white,
                                          fontSize: 10,
                                          letterSpacing: 1.2,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            if (contest.badgeText != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppTheme.goldYellow.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: AppTheme.goldYellow.withValues(alpha: 0.4),
                                    width: 1,
                                  ),
                                ),
                                child: Text(
                                  contest.badgeText!,
                                  style: const TextStyle(
                                    color: AppTheme.goldYellow,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Text(
                          contest.title,
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppTheme.white,
                              ),
                        ),
                        const SizedBox(height: 8),
                        if (contest.prize != null)
                          Text(
                            contest.prize!,
                            style: Theme.of(context).textTheme.displayMedium?.copyWith(
                                  color: AppTheme.goldYellow,
                                  fontWeight: FontWeight.w900,
                                  shadows: [
                                    Shadow(
                                      color: AppTheme.goldYellow.withValues(alpha: 0.3),
                                      blurRadius: 12,
                                    ),
                                  ],
                                ),
                          ),
                      ],
                    ),
                  ),
                  Positioned(
                    top: 24,
                    right: 20,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: AppTheme.emeraldGreen.withValues(alpha: 0.4),
                          width: 1,
                        ),
                      ),
                      child: Text(
                        '${contest.pointsToJoin} PTS',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: AppTheme.emeraldGreen,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                      ),
                    ),
                  ),
                ],
              ),
              Container(
                height: 1,
                color: AppTheme.goldYellow.withValues(alpha: 0.15),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildGoldStat(
                            icon: Icons.account_balance_wallet_rounded,
                            label: 'Entry Fee',
                            value: '\u20B9${contest.entryFeeInr.toStringAsFixed(0)}',
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildGoldStat(
                            icon: Icons.groups_rounded,
                            label: 'Total Slots',
                            value: '${contest.maxSlots}',
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildGoldStat(
                            icon: Icons.person_rounded,
                            label: 'Filled',
                            value: '${contest.filledSlots}',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: contest.fillPercentage,
                        backgroundColor: const Color(0xFF2A3040),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          AppTheme.goldYellow.withValues(alpha: 0.8),
                        ),
                        minHeight: 8,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: AppTheme.primaryRed,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              '${contest.spotsLeft} spots left',
                              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                    color: AppTheme.primaryRed,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                            ),
                          ],
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
                    const SizedBox(height: 20),
                    GestureDetector(
                      onTap: () => _joinContest(contest),
                      child: Container(
                        width: double.infinity,
                        height: 52,
                        decoration: BoxDecoration(
                          gradient: AppTheme.goldGradient,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.goldYellow.withValues(alpha: 0.3),
                              blurRadius: 12,
                              spreadRadius: 0,
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Text(
                            'JOIN NOW',
                            style: TextStyle(
                              color: AppTheme.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    ),
    );
  }

  Widget _buildMegaContestCard(ContestModel contest) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A1F2E), Color(0xFF0F1623)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: AppTheme.goldYellow.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (contest.badgeText != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.goldYellow.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: AppTheme.goldYellow.withValues(alpha: 0.4),
                                width: 1,
                              ),
                            ),
                            child: Text(
                              contest.badgeText!,
                              style: const TextStyle(
                                color: AppTheme.goldYellow,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.0,
                              ),
                            ),
                          ),
                        ),
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
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: AppTheme.goldYellow,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.emeraldGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppTheme.emeraldGreen.withValues(alpha: 0.3),
                      width: 1,
                    ),
                  ),
                  child: Text(
                    '${contest.pointsToJoin} PTS',
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                          color: AppTheme.emeraldGreen,
                          fontSize: 12,
                        ),
                  ),
                ),
              ],
            ),
          ),
          Container(
            height: 1,
            color: AppTheme.goldYellow.withValues(alpha: 0.1),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    _buildGoldMiniStat(
                      icon: Icons.account_balance_wallet_rounded,
                      value: '\u20B9${contest.entryFeeInr.toStringAsFixed(0)}',
                    ),
                    const SizedBox(width: 20),
                    _buildGoldMiniStat(
                      icon: Icons.groups_rounded,
                      value: '${contest.filledSlots}/${contest.maxSlots}',
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: contest.fillPercentage,
                    backgroundColor: const Color(0xFF2A3040),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      AppTheme.goldYellow.withValues(alpha: 0.7),
                    ),
                    minHeight: 6,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${contest.spotsLeft} spots left',
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                            color: AppTheme.primaryRed,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      '${(contest.fillPercentage * 100).toStringAsFixed(0)}%',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.greyMedium,
                            fontSize: 11,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                GestureDetector(
                  onTap: () => _joinContest(contest),
                  child: Container(
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppTheme.emeraldGreen.withValues(alpha: 0.9),
                          AppTheme.emeraldGreen,
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.emeraldGreen.withValues(alpha: 0.2),
                          blurRadius: 8,
                          spreadRadius: 0,
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          'JOIN NOW',
                          style: TextStyle(
                            color: AppTheme.white,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Icon(
                          Icons.arrow_forward_rounded,
                          size: 16,
                          color: AppTheme.white.withValues(alpha: 0.8),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGoldStat({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: AppTheme.goldYellow.withValues(alpha: 0.7)),
            const SizedBox(width: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.greyMedium,
                    fontSize: 11,
                  ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: AppTheme.white,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
        ),
      ],
    );
  }

  Widget _buildGoldMiniStat({
    required IconData icon,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppTheme.goldYellow.withValues(alpha: 0.6)),
        const SizedBox(width: 6),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.white,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
        ),
      ],
    );
  }

  Widget _buildShimmer() {
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 2,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 100,
        left: 20,
        right: 20,
      ),
      itemBuilder: (context, index) {
        return ShimmerCard(
          height: index == 0 ? 400 : 240,
          margin: const EdgeInsets.only(bottom: 20),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    ShimmerLine(width: 100, height: 24, borderRadius: 12),
                    const Spacer(),
                    ShimmerLine(width: 60, height: 24, borderRadius: 12),
                  ],
                ),
                const SizedBox(height: 20),
                ShimmerLine(width: 200, height: 28),
                const SizedBox(height: 8),
                ShimmerLine(width: 160, height: 32),
                const SizedBox(height: 16),
                if (index == 0) ...[
                  const Spacer(),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ShimmerLine(width: 60, height: 12),
                            const SizedBox(height: 4),
                            ShimmerLine(width: 80, height: 18),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ShimmerLine(width: 60, height: 12),
                            const SizedBox(height: 4),
                            ShimmerLine(width: 60, height: 18),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  ShimmerLine(width: double.infinity, height: 8, borderRadius: 4),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ShimmerLine(width: 80, height: 12),
                      ShimmerLine(width: 60, height: 12),
                    ],
                  ),
                  const SizedBox(height: 20),
                  ShimmerLine(width: double.infinity, height: 52, borderRadius: 16),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildError(VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppTheme.goldYellow.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.cloud_off_rounded,
                size: 44,
                color: AppTheme.goldYellow,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Failed to load mega contests',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.white,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Please check your connection and try again',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.greyMedium,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('RETRY'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.goldYellow,
                foregroundColor: AppTheme.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppTheme.goldYellow.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.emoji_events_outlined,
                size: 44,
                color: AppTheme.goldYellow,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No mega contests available',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.white,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Check back later for premium mega contests',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.greyMedium,
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
