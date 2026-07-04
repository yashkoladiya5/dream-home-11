import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/wallet_provider.dart';
import '../widgets/transaction_list_view.dart';

class ContestTransactionsScreen extends ConsumerWidget {
  const ContestTransactionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final txAsync = ref.watch(filteredTransactionProvider('entry_fee,points_earned'));

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Contest Transactions'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(filteredTransactionProvider('entry_fee,points_earned').future),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              TransactionListView(
                transactionsAsync: txAsync,
                onRefresh: () => ref.invalidate(filteredTransactionProvider('entry_fee,points_earned')),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
