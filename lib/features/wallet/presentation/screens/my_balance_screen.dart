import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/providers/user_profile_provider.dart';
import '../../data/models/transaction.dart';
import '../../presentation/providers/wallet_provider.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class MyBalanceScreen extends ConsumerWidget {
  const MyBalanceScreen({super.key});

  double _tierProgress(int lifetimePoints) {
    if (lifetimePoints >= 5000) return 1.0;
    if (lifetimePoints >= 2000) return (lifetimePoints - 2000) / 3000;
    if (lifetimePoints >= 1000) return (lifetimePoints - 1000) / 1000;
    return lifetimePoints / 1000;
  }

  String _nextTier(int lifetimePoints) {
    if (lifetimePoints >= 5000) return 'MAXED';
    if (lifetimePoints >= 2000) return 'Platinum';
    if (lifetimePoints >= 1000) return 'Gold';
    return 'Silver';
  }

  String _pointsToNext(int lifetimePoints) {
    if (lifetimePoints >= 5000) return '0';
    if (lifetimePoints >= 2000) return '${5000 - lifetimePoints}';
    if (lifetimePoints >= 1000) return '${2000 - lifetimePoints}';
    return '${1000 - lifetimePoints}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(userProfileProvider);
    final txAsync = ref.watch(transactionHistoryProvider);
    final summaryAsync = ref.watch(balanceSummaryProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('My Balance'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: profileAsync.when(
        loading: () => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: const [
                  Expanded(child: ShimmerCard(height: 140)),
                  SizedBox(width: 12),
                  Expanded(child: ShimmerCard(height: 140)),
                ],
              ),
              const SizedBox(height: 12),
              const ShimmerCard(height: 200),
              const SizedBox(height: 12),
              const ShimmerCard(height: 140),
              const SizedBox(height: 12),
              const ShimmerCard(height: 60),
              const SizedBox(height: 8),
              const ShimmerCard(height: 60),
              const SizedBox(height: 8),
              const ShimmerCard(height: 60),
            ],
          ),
        ),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, color: AppTheme.greyMedium, size: 64),
              const SizedBox(height: 16),
              Text(
                'Failed to load balance details',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppTheme.greyMedium),
              ),
              const SizedBox(height: 16),
              TextButton.icon(
                onPressed: () => ref.read(userProfileProvider.notifier).fetchProfile(),
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (profile) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: AppTheme.darkCardGradient,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0x1FFFFFFF)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.account_balance_wallet_rounded, color: AppTheme.emeraldGreen, size: 24),
                          const SizedBox(height: 8),
                          Text('Cash Balance', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.greyMedium)),
                          const SizedBox(height: 4),
                          Text(
                            '₹${profile.walletBalanceInr.toStringAsFixed(2)}',
                            style: Theme.of(context).textTheme.displayMedium?.copyWith(fontSize: 28, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        gradient: AppTheme.darkCardGradient,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0x1FFFFFFF)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.stars_rounded, color: AppTheme.goldYellow, size: 24),
                          const SizedBox(height: 8),
                          Text('Points Balance', style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.greyMedium)),
                          const SizedBox(height: 4),
                          Text(
                            '${profile.pointsBalance} PTS',
                            style: Theme.of(context).textTheme.displayMedium?.copyWith(fontSize: 28, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              summaryAsync.when(
                loading: () => Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: AppTheme.darkCardGradient,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0x1FFFFFFF)),
                  ),
                  child: const Column(
                    children: [
                      ShimmerLine(height: 20),
                      SizedBox(height: 12),
                      ShimmerLine(height: 16),
                      SizedBox(height: 8),
                      ShimmerLine(height: 16),
                      SizedBox(height: 8),
                      ShimmerLine(height: 16),
                      SizedBox(height: 8),
                      ShimmerLine(height: 16),
                      SizedBox(height: 8),
                      ShimmerLine(height: 20),
                    ],
                  ),
                ),
                error: (e, s) => Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: AppTheme.darkCardGradient,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0x1FFFFFFF)),
                  ),
                  child: Center(
                    child: Text('N/A', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium)),
                  ),
                ),
                data: (summary) => Container(
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
                          const Icon(Icons.receipt_long_rounded, color: AppTheme.greyLight),
                          const SizedBox(width: 8),
                          Text('Account Summary', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const Divider(color: Color(0x1FFFFFFF)),
                      _statRow(context, 'Total Cash Deposited', '₹${summary.totalCashDeposited.toStringAsFixed(2)}'),
                      const SizedBox(height: 8),
                      _statRow(context, 'Total Cash Spent', '₹${summary.totalCashSpent.toStringAsFixed(2)}'),
                      const SizedBox(height: 8),
                      _statRow(context, 'Total Points Earned', '${summary.totalPointsEarned} PTS'),
                      const SizedBox(height: 8),
                      _statRow(context, 'Total Points Spent', '${summary.totalPointsSpent} PTS'),
                      const Divider(color: Color(0x1FFFFFFF)),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Net Cash', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                          Text(
                            '₹${summary.netCash.toStringAsFixed(2)}',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: summary.netCash >= 0 ? AppTheme.emeraldGreen : AppTheme.primaryRed,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Container(
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
                        const Icon(Icons.workspace_premium_rounded, color: AppTheme.goldYellow),
                        const SizedBox(width: 10),
                        Text('Membership Tier', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Current Tier: ${profile.currentTier.toUpperCase()}',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.goldYellow,
                      ),
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: _tierProgress(profile.lifetimePoints),
                      backgroundColor: const Color(0xFF1E293B),
                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.goldYellow),
                      minHeight: 8,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${_pointsToNext(profile.lifetimePoints)} points to ${_nextTier(profile.lifetimePoints)}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Text('Transaction History', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
              Text('Recent', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium)),
              const SizedBox(height: 8),
              txAsync.when(
                loading: () => Column(
                  children: List.generate(
                    5,
                    (_) => const Padding(
                      padding: EdgeInsets.only(bottom: 8),
                      child: ShimmerCard(height: 60, borderRadius: 14),
                    ),
                  ),
                ),
                error: (e, s) => Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: AppTheme.greyMedium, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Failed to load transactions',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
                    ),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: () => ref.invalidate(transactionHistoryProvider),
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
                data: (transactions) {
                  if (transactions.isEmpty) {
                    return Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 48),
                      child: Column(
                        children: [
                          const Icon(Icons.receipt_long_rounded, color: AppTheme.greyMedium, size: 48),
                          const SizedBox(height: 12),
                          Text(
                            'No transactions yet',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.greyMedium),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Your wallet activity will appear here',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
                          ),
                        ],
                      ),
                    );
                  }
                  return Column(
                    children: transactions.map((tx) => _buildTransactionItem(context, tx)).toList(),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statRow(BuildContext context, String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium)),
        Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold, color: AppTheme.white)),
      ],
    );
  }

  Widget _buildTransactionItem(BuildContext context, TransactionModel tx) {
    final isCredit = tx.isCredit;
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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
              color: isCredit ? AppTheme.emeraldGreen.withValues(alpha: 0.15) : AppTheme.primaryRed.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              isCredit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
              color: isCredit ? AppTheme.emeraldGreen : AppTheme.primaryRed,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tx.typeLabel, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
                if (tx.description != null && tx.description!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(tx.description!, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 11, color: AppTheme.greyMedium)),
                  ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isCredit ? '+' : '-'}₹${tx.cashAmount.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: isCredit ? AppTheme.emeraldGreen : AppTheme.primaryRed,
                ),
              ),
              if (tx.pointsAmount > 0)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    '${isCredit ? '+' : '-'}${tx.pointsAmount} PTS',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontSize: 11,
                      color: isCredit ? AppTheme.emeraldGreen : AppTheme.primaryRed,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
