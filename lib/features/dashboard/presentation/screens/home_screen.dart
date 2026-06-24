import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_profile_provider.dart';
import '../widgets/shimmer_widget.dart';
import '../widgets/banner_carousel.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(userProfileProvider);

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 350),
      switchInCurve: Curves.easeIn,
      switchOutCurve: Curves.easeOut,
      child: profileState.when(
        data: (profile) {
          return SingleChildScrollView(
            key: const ValueKey('loaded'),
            physics: const BouncingScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 12),
                  // User Points & Tier Summary
                  Container(
                    padding: const EdgeInsets.all(24.0),
                    decoration: BoxDecoration(
                      gradient: AppTheme.darkCardGradient,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0x0CFFFFFF)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x05000000),
                          blurRadius: 10,
                          offset: Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'WELCOME BACK',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: AppTheme.greyMedium,
                                        letterSpacing: 1.0,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 10,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  profile.fullName ?? 'Player 1',
                                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.2,
                                      ),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                gradient: AppTheme.goldGradient,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppTheme.goldYellow.withValues(alpha: 0.2),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.workspace_premium_rounded, size: 14, color: AppTheme.white),
                                  const SizedBox(width: 4),
                                  Text(
                                    profile.currentTier.toUpperCase(),
                                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 32, color: Color(0x12FFFFFF)),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Total Points',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: AppTheme.greyMedium,
                                        fontSize: 12,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${profile.pointsBalance} PTS',
                                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                        color: AppTheme.white,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 22,
                                      ),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  'Wallet Cash',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: AppTheme.greyMedium,
                                        fontSize: 12,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '₹${profile.walletBalanceInr.toStringAsFixed(2)}',
                                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                        color: AppTheme.emeraldGreen,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 22,
                                      ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  const BannerCarousel(),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
        loading: () {
          return SingleChildScrollView(
            key: const ValueKey('loading'),
            physics: const NeverScrollableScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 12),
                  ShimmerCard(
                    height: 160,
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: const [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  ShimmerLine(width: 80, height: 10),
                                  SizedBox(height: 8),
                                  ShimmerLine(width: 130, height: 18),
                                ],
                              ),
                              ShimmerCard(width: 70, height: 26, borderRadius: 13),
                            ],
                          ),
                          const Spacer(),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: const [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  ShimmerLine(width: 70, height: 10),
                                  SizedBox(height: 8),
                                  ShimmerLine(width: 90, height: 18),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  ShimmerLine(width: 70, height: 10),
                                  SizedBox(height: 8),
                                  ShimmerLine(width: 90, height: 18),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  const Center(child: ShimmerLine(width: 180, height: 22)),
                  const SizedBox(height: 12),
                  const Center(child: ShimmerLine(width: 260, height: 14)),
                  const SizedBox(height: 8),
                  const Center(child: ShimmerLine(width: 220, height: 14)),
                  const SizedBox(height: 40),
                  const Center(child: ShimmerCircle(size: 80)),
                ],
              ),
            ),
          );
        },
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 48),
                const SizedBox(height: 16),
                const Text(
                  'Failed to load home details',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.read(userProfileProvider.notifier).fetchProfile(),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}


