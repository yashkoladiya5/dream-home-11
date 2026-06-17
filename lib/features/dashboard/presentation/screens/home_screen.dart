import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Dream Home 11'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              // Sign out and redirect to language selector
              context.go('/language');
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
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
                              'Player 1',
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
                                'Bronze Tier',
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
                              '1,250 PTS',
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
                              'Global Rank',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppTheme.greyMedium,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '#482',
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
              const Spacer(),
              Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppTheme.emeraldGreen.withOpacity(0.1),
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
      ),
    );
  }
}
