import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_profile_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileState = ref.watch(userProfileProvider);

    return profileState.when(
      data: (profile) {
        return SingleChildScrollView(
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
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.greyDark),
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
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                profile.fullName ?? 'Player 1',
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.bold,
                                    ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              gradient: AppTheme.goldGradient,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.workspace_premium_rounded, size: 16, color: AppTheme.white),
                                const SizedBox(width: 4),
                                Text(
                                  profile.currentTier.toUpperCase(),
                                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                        fontSize: 12,
                                      ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 32, color: AppTheme.greyDark),
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
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${profile.pointsBalance} PTS',
                                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                      color: AppTheme.white,
                                      fontWeight: FontWeight.w900,
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
                                    ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '₹${profile.walletBalanceInr.toStringAsFixed(2)}',
                                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                      color: AppTheme.emeraldGreen,
                                      fontWeight: FontWeight.w900,
                                    ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
                
                Text(
                  'Dashboard Active',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Phase 1 Setup completed successfully! Welcome to the new core structure.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.greyMedium,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppTheme.emeraldGreen.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_circle_outline_rounded,
                      color: AppTheme.emeraldGreen,
                      size: 48,
                    ),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        );
      },
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(48.0),
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryRed),
          ),
        ),
      ),
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
    );
  }
}

