import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/user_profile_provider.dart';

class ContestTab extends ConsumerWidget {
  const ContestTab({super.key});

  Future<void> _joinContest(
    BuildContext context,
    WidgetRef ref,
    String title,
    double entryFee,
    int pointsEarned,
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
          'Do you want to join "$title"?\nEntry Fee: ₹${entryFee.toStringAsFixed(0)}\nYou will earn: $pointsEarned PTS',
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
      final success = await ref.read(userProfileProvider.notifier).joinContest(entryFee, pointsEarned);
      if (context.mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: AppTheme.emeraldGreen,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              content: Text(
                'Successfully joined "$title"! Registered for the contest.',
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
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

            // Mega Contest Card
            _buildContestCard(
              context,
              title: 'Mega Dream Home Contest',
              prize: '3 BHK Luxury Apartment in Mumbai',
              entryFee: 49.0,
              pointsEarned: 100,
              totalSpots: 10000,
              spotsLeft: 3420,
              badgeText: 'MEGA PRIZE',
              badgeColor: AppTheme.goldYellow,
              onJoin: () => _joinContest(context, ref, 'Mega Dream Home Contest', 49.0, 100),
            ),
            const SizedBox(height: 16),

            // Premium Contest Card
            _buildContestCard(
              context,
              title: 'Weekend Villa Clash',
              prize: 'Premium Villa Weekend Gateway',
              entryFee: 99.0,
              pointsEarned: 250,
              totalSpots: 5000,
              spotsLeft: 1200,
              badgeText: 'HOT',
              badgeColor: AppTheme.primaryRed,
              onJoin: () => _joinContest(context, ref, 'Weekend Villa Clash', 99.0, 250),
            ),
            const SizedBox(height: 16),

            // Starter Contest Card
            _buildContestCard(
              context,
              title: 'Starter Dream Cottage',
              prize: 'Mountain Cottage Stay & Title',
              entryFee: 19.0,
              pointsEarned: 30,
              totalSpots: 1000,
              spotsLeft: 950,
              badgeText: 'FAST FILLING',
              badgeColor: AppTheme.emeraldGreen,
              onJoin: () => _joinContest(context, ref, 'Starter Dream Cottage', 19.0, 30),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildContestCard(
    BuildContext context, {
    required String title,
    required String prize,
    required double entryFee,
    required int pointsEarned,
    required int totalSpots,
    required int spotsLeft,
    required String badgeText,
    required Color badgeColor,
    required VoidCallback onJoin,
  }) {
    final spotsFilled = totalSpots - spotsLeft;
    final fillPercentage = spotsFilled / totalSpots;

    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Card Header with Badge
          Padding(
            padding: const EdgeInsets.only(left: 20.0, right: 20.0, top: 16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: badgeColor.withValues(alpha: 0.4), width: 1),
                  ),
                  child: Text(
                    badgeText,
                    style: TextStyle(
                      color: badgeColor,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.0,
                    ),
                  ),
                ),
                Text(
                  'Entry: ₹${entryFee.toStringAsFixed(0)}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.emeraldGreen,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                ),
              ],
            ),
          ),

          // Prize Info
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  prize,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.greyLight,
                      ),
                ),
              ],
            ),
          ),

          // Progress Bar / Spots Indicators
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0),
            child: Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: fillPercentage,
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
                      '$spotsLeft spots left',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.primaryRed,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      '$totalSpots total spots',
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

          // Join Button Action
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

