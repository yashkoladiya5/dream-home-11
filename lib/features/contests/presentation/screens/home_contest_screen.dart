import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/contest_model.dart';
import '../providers/contest_provider.dart';
import '../helpers/join_contest_dialog.dart';
import '../screens/contest_rules_screen.dart';
import '../screens/join_success_screen.dart';
import '../widgets/home_prize_card.dart';
import '../../../dashboard/data/models/user_profile.dart';
import '../../../dashboard/presentation/providers/user_profile_provider.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class HomeContestScreen extends ConsumerStatefulWidget {
  const HomeContestScreen({super.key});

  @override
  ConsumerState<HomeContestScreen> createState() => _HomeContestScreenState();
}

class _HomeContestScreenState extends ConsumerState<HomeContestScreen> {
  final List<Map<String, String>> _sampleHomes = [
    {
      'name': '3 BHK Luxury Apartment',
      'location': 'Mumbai, Maharashtra',
      'value': '\u20B91.2 Cr',
      'icon': '\u{1F3E0}',
    },
    {
      'name': 'Premium Villa',
      'location': 'Goa',
      'value': '\u20B985 Lakhs',
      'icon': '\u{1F3E1}',
    },
    {
      'name': 'Beachfront Villa',
      'location': 'Kerala',
      'value': '\u20B92.5 Cr',
      'icon': '\u{1F3D6}\uFE0F',
    },
    {
      'name': 'Mountain Cottage',
      'location': 'Manali, Himachal',
      'value': '\u20B945 Lakhs',
      'icon': '\u{1F3D4}\uFE0F',
    },
    {
      'name': 'Sea-facing Penthouse',
      'location': 'Goa',
      'value': '\u20B93.8 Cr',
      'icon': '\u{1F30A}',
    },
  ];

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
        final joinResult = await ref
            .read(userProfileProvider.notifier)
            .joinContestById(contest.id);
        if (context.mounted) {
          if (joinResult != null) {
            final userData = UserProfile.fromJson(
              joinResult['user'] as Map<String, dynamic>,
            );
            ref
                .read(contestListProvider.notifier)
                .updateContestAfterJoin(contest.id);
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
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                content: const Text(
                  'Failed to join contest. Please check your wallet balance.',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.white,
                  ),
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
      appBar: AppBar(title: const Text('Dream Homes'), centerTitle: true),
      body: contestsAsync.when(
        loading: () => _buildLoadingSkeleton(),
        error: (err, stack) => _buildErrorState(err),
        data: (contests) {
          final homeContests = contests.where((c) => c.type == 'home').toList();
          if (homeContests.isEmpty) {
            return _buildEmptyState();
          }
          return _buildContent(homeContests);
        },
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const ShimmerCard(height: 200),
            const SizedBox(height: 28),
            const ShimmerLine(width: 140, height: 20),
            const SizedBox(height: 16),
            SizedBox(
              height: 210,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: 3,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (_, _) =>
                    const ShimmerCard(width: 220, height: 210),
              ),
            ),
            const SizedBox(height: 28),
            const ShimmerLine(width: 160, height: 20),
            const SizedBox(height: 16),
            const ShimmerCard(height: 180),
            const SizedBox(height: 14),
            const ShimmerCard(height: 180),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(Object err) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.cloud_off_rounded,
              size: 64,
              color: AppTheme.greyMedium,
            ),
            const SizedBox(height: 16),
            Text(
              'Could not load home contests',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              err.toString(),
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () =>
                  ref.read(contestListProvider.notifier).refreshContests(),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('RETRY'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.home_rounded,
              size: 64,
              color: AppTheme.greyMedium,
            ),
            const SizedBox(height: 16),
            Text(
              'No home contests available right now',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Check back later for exciting home prize giveaways!',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () =>
                  ref.read(contestListProvider.notifier).refreshContests(),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('REFRESH'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(List<ContestModel> homeContests) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
            child: Text(
              'Dream Homes',
              style: Theme.of(
                context,
              ).textTheme.displayMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'Explore the prizes you can win',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.greyMedium,
                fontSize: 15,
              ),
            ),
          ),
          const SizedBox(height: 20),
          _buildFeaturedHome(homeContests.first),
          const SizedBox(height: 28),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'All Home Prizes',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 210,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: _sampleHomes.length,
              itemBuilder: (context, index) {
                final home = _sampleHomes[index];
                return _AnimatedSlideFadeItem(
                  index: index,
                  child: HomePrizeCard(
                    name: home['name']!,
                    location: home['location']!,
                    value: home['value']!,
                    emoji: home['icon']!,
                    onTap: () => context.push('/prize-homes'),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 28),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(
              'Open Contests',
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 14),
          ...List.generate(homeContests.length, (index) {
            final contest = homeContests[index];
            final homeData = _sampleHomes[index % _sampleHomes.length];
            return _AnimatedSlideFadeItem(
              index: index,
              child: Padding(
                padding: EdgeInsets.only(
                  left: 20,
                  right: 20,
                  bottom: index == homeContests.length - 1 ? 24 : 12,
                ),
                child: _buildHomeContestCard(contest, homeData),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildFeaturedHome(ContestModel contest) {
    final featured = _sampleHomes[0];
    return GestureDetector(
      onTap: () => context.push('/prize-homes'),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppTheme.goldYellow, Color(0xFFD97706)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(28),
        ),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: LinearGradient(
              colors: [
                AppTheme.darkSlate.withValues(alpha: 0.15),
                AppTheme.darkSlate.withValues(alpha: 0.75),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                top: 20,
                right: 20,
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppTheme.goldYellow.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.home_rounded,
                    color: AppTheme.goldYellow,
                    size: 30,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.goldYellow.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: AppTheme.goldYellow.withValues(alpha: 0.5),
                        ),
                      ),
                      child: const Text(
                        'FEATURED',
                        style: TextStyle(
                          color: AppTheme.goldYellow,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      featured['name']!,
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppTheme.white,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_rounded,
                          size: 16,
                          color: AppTheme.greyLight,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          featured['location']!,
                          style: Theme.of(context).textTheme.bodyLarge
                              ?.copyWith(
                                color: AppTheme.greyLight,
                                fontSize: 14,
                              ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.white.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.stars_rounded,
                            size: 18,
                            color: AppTheme.goldYellow,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Estimated Value: ${featured['value']!}',
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(
                                  color: AppTheme.goldYellow,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHomeContestCard(
    ContestModel contest,
    Map<String, String> homeData,
  ) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: InkWell(
        onTap: () => context.push('/contest/${contest.id}'),
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.goldYellow.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Center(
                      child: Text(
                        homeData['icon']!,
                        style: const TextStyle(fontSize: 22),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          contest.title,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.bold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          homeData['name']!,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: AppTheme.goldYellow,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      gradient: AppTheme.goldGradient,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      homeData['value']!,
                      style: const TextStyle(
                        color: AppTheme.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: contest.fillPercentage,
                  backgroundColor: AppTheme.greyDark,
                  valueColor: const AlwaysStoppedAnimation<Color>(
                    AppTheme.emeraldGreen,
                  ),
                  minHeight: 5,
                ),
              ),
              const SizedBox(height: 10),
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
                    'Fee: \u20B9${contest.entryFeeInr.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.emeraldGreen,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => _joinContest(contest),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.emeraldGreen,
                    foregroundColor: AppTheme.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 2,
                    shadowColor: AppTheme.emeraldGreen.withValues(alpha: 0.3),
                  ),
                  child: const Text(
                    'JOIN NOW',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AnimatedSlideFadeItem extends StatefulWidget {
  final int index;
  final Widget child;

  const _AnimatedSlideFadeItem({required this.index, required this.child});

  @override
  State<_AnimatedSlideFadeItem> createState() => _AnimatedSlideFadeItemState();
}

class _AnimatedSlideFadeItemState extends State<_AnimatedSlideFadeItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    Future.delayed(Duration(milliseconds: widget.index * 80), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(position: _slideAnimation, child: widget.child),
    );
  }
}
