import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/providers/user_profile_provider.dart';
import '../../presentation/providers/wallet_provider.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(userProfileProvider);
    final txAsync = ref.watch(transactionHistoryProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('My Wallet'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            ref.read(userProfileProvider.notifier).fetchProfile(),
            ref.refresh(transactionHistoryProvider.future),
          ]);
        },
        child: profileAsync.when(
          data: (profile) {
            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: AppTheme.goldGradient,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.goldYellow.withValues(alpha: 0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Total Balance', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 8),
                        Text(
                          '\u{20B9}${profile.walletBalanceInr.toStringAsFixed(2)}',
                          style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            const Icon(Icons.stars_rounded, color: Colors.white, size: 18),
                            const SizedBox(width: 6),
                            Text('${profile.pointsBalance} PTS', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.workspace_premium_rounded, size: 14, color: Colors.white),
                                  SizedBox(width: 4),
                                  Text(profile.currentTier.toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _ActionCard(
                              icon: Icons.add_circle_outline_rounded,
                              iconColor: AppTheme.goldYellow,
                              title: 'Add Cash',
                              subtitle: 'Deposit money',
                              onTap: () => context.push('/add-cash'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _ActionCard(
                              icon: Icons.account_balance_wallet_rounded,
                              iconColor: AppTheme.emeraldGreen,
                              title: 'My Balance',
                              subtitle: 'View details',
                              onTap: () => context.push('/my-balance'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: _ActionCard(
                          icon: Icons.logout_rounded,
                          iconColor: AppTheme.goldYellow,
                          title: 'Withdraw',
                          subtitle: 'Transfer to bank',
                          onTap: () => context.push('/withdraw'),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: () => context.push('/withdraw-history'),
                          icon: Icon(Icons.history_rounded, size: 16, color: AppTheme.greyMedium),
                          label: Text('View History', style: TextStyle(color: AppTheme.greyMedium, fontSize: 12)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Recent Transactions',
                        style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      TextButton(
                        onPressed: () => context.push('/my-balance'),
                        child: Text('View All', style: TextStyle(color: AppTheme.primaryRed, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  txAsync.when(
                    data: (txs) {
                      if (txs.isEmpty) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 40),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(Icons.receipt_long_rounded, color: AppTheme.greyMedium.withValues(alpha: 0.5), size: 48),
                                const SizedBox(height: 12),
                                Text('No transactions yet', style: TextStyle(color: AppTheme.greyMedium)),
                              ],
                            ),
                          ),
                        );
                      }
                      return Column(
                        children: txs.take(5).map((tx) {
                          return Container(
                            padding: const EdgeInsets.all(14),
                            margin: const EdgeInsets.only(bottom: 10),
                            decoration: BoxDecoration(
                              gradient: AppTheme.darkCardGradient,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0x1FFFFFFF)),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: (tx.isCredit ? AppTheme.emeraldGreen : AppTheme.primaryRed).withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(
                                    tx.isCredit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                                    color: tx.isCredit ? AppTheme.emeraldGreen : AppTheme.primaryRed,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(tx.typeLabel, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                                      if (tx.description != null) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          tx.description!,
                                          style: theme.textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium, fontSize: 11),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      tx.isCredit ? '+\u{20B9}${tx.cashAmount.toStringAsFixed(0)}' : '-\u{20B9}${tx.cashAmount.toStringAsFixed(0)}',
                                      style: TextStyle(
                                        color: tx.isCredit ? AppTheme.emeraldGreen : AppTheme.primaryRed,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                    ),
                                    if (tx.pointsAmount > 0)
                                      Text(
                                        '${tx.isCredit ? '+' : '-'}${tx.pointsAmount} pts',
                                        style: TextStyle(color: AppTheme.goldYellow, fontSize: 11, fontWeight: FontWeight.w600),
                                      ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      );
                    },
                    loading: () => Column(
                      children: const [
                        ShimmerCard(height: 70),
                        SizedBox(height: 8),
                        ShimmerCard(height: 70),
                        SizedBox(height: 8),
                        ShimmerCard(height: 70),
                      ],
                    ),
                    error: (e, s) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed.withValues(alpha: 0.7), size: 32),
                            const SizedBox(height: 8),
                            Text('Failed to load transactions', style: TextStyle(color: AppTheme.greyMedium, fontSize: 13)),
                            const SizedBox(height: 8),
                            TextButton(
                              onPressed: () => ref.invalidate(transactionHistoryProvider),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
          loading: () => SingleChildScrollView(
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(
              children: const [
                ShimmerCard(height: 180),
                SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(child: ShimmerCard(height: 80)),
                    SizedBox(width: 12),
                    Expanded(child: ShimmerCard(height: 80)),
                  ],
                ),
                SizedBox(height: 20),
                ShimmerLine(width: 140, height: 20),
                SizedBox(height: 12),
                ShimmerCard(height: 70),
                SizedBox(height: 8),
                ShimmerCard(height: 70),
                SizedBox(height: 8),
                ShimmerCard(height: 70),
              ],
            ),
          ),
          error: (err, stack) => SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: SizedBox(
              height: MediaQuery.of(context).size.height * 0.7,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 48),
                    const SizedBox(height: 16),
                    const Text('Failed to load wallet', style: TextStyle(color: AppTheme.greyMedium)),
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
        ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: AppTheme.darkCardGradient,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x1FFFFFFF)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(height: 12),
            Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(subtitle, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}
