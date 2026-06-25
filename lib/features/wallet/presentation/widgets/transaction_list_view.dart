import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/transaction.dart';

class TransactionListView extends ConsumerWidget {
  final AsyncValue<List<TransactionModel>> transactionsAsync;
  final VoidCallback? onRefresh;

  const TransactionListView({
    super.key,
    required this.transactionsAsync,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return transactionsAsync.when(
      data: (txs) {
        if (txs.isEmpty) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 40),
            child: Center(
              child: Column(
                children: [
                  Icon(Icons.receipt_long_rounded, color: AppTheme.greyMedium.withValues(alpha: 0.5), size: 48),
                  const SizedBox(height: 12),
                  Text('No transactions found', style: TextStyle(color: AppTheme.greyMedium)),
                ],
              ),
            ),
          );
        }
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: txs.map((tx) {
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
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryRed)),
      error: (e, s) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed.withValues(alpha: 0.7), size: 32),
              const SizedBox(height: 8),
              Text('Failed to load transactions', style: TextStyle(color: AppTheme.greyMedium, fontSize: 13)),
              const SizedBox(height: 8),
              if (onRefresh != null)
                TextButton(
                  onPressed: onRefresh,
                  child: const Text('Retry'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
