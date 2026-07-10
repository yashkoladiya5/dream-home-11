import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../../data/models/withdraw_model.dart';
import '../providers/withdraw_history_provider.dart';
import '../providers/withdraw_stats_provider.dart';

class WithdrawHistoryScreen extends ConsumerStatefulWidget {
  const WithdrawHistoryScreen({super.key});

  @override
  ConsumerState<WithdrawHistoryScreen> createState() => _WithdrawHistoryScreenState();
}

class _WithdrawHistoryScreenState extends ConsumerState<WithdrawHistoryScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      final notifier = ref.read(withdrawHistoryScreenProvider.notifier);
      if (notifier.hasMore && !notifier.isLoadingMore) {
        notifier.loadNextPage();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final historyAsync = ref.watch(withdrawHistoryScreenProvider);
    final statsAsync = ref.watch(withdrawStatsProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Withdraw History'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(withdrawHistoryScreenProvider.notifier).refresh(),
        child: historyAsync.when(
          loading: () => _buildShimmerList(),
          error: (e, _) => _buildError(e),
          data: (history) {
            if (history.withdrawals.isEmpty) {
              return _buildEmpty();
            }
            final hasMore = ref.read(withdrawHistoryScreenProvider.notifier).hasMore;
            final isLoadingMore = ref.read(withdrawHistoryScreenProvider.notifier).isLoadingMore;
            return ListView.builder(
              controller: _scrollController,
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              itemCount: 1 + history.withdrawals.length + (hasMore || isLoadingMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == 0) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: _buildStatsCard(statsAsync),
                  );
                }
                final itemIndex = index - 1;
                if (itemIndex < history.withdrawals.length) {
                  return _buildRecordItem(history.withdrawals[itemIndex]);
                }
                if (isLoadingMore) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryRed)),
                  );
                }
                return _buildLoadMoreButton();
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildStatsCard(AsyncValue<WithdrawStats> statsAsync) {
    return statsAsync.when(
      loading: () => ShimmerCard(height: 100, borderRadius: 16),
          error: (_, _) => const SizedBox.shrink(),
      data: (stats) {
        if (stats.totalCount == 0) return const SizedBox.shrink();
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: AppTheme.darkCardGradient,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x1FFFFFFF)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Withdrawn', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium)),
                  Text('₹${stats.totalWithdrawn.toStringAsFixed(0)}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, color: AppTheme.white)),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _statChip('${stats.pendingCount} Pending', AppTheme.goldYellow),
                  const SizedBox(width: 8),
                  _statChip('${stats.approvedCount} Approved', AppTheme.emeraldGreen),
                  const SizedBox(width: 8),
                  _statChip('${stats.rejectedCount} Rejected', AppTheme.primaryRed),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _statChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }

  Widget _buildRecordItem(WithdrawalRecord record) {
    final isApproved = record.isApproved;
    final isRejected = record.isRejected;

    final Color statusColor;
    final IconData statusIcon;
    final String statusLabel;
    if (isApproved) {
      statusColor = AppTheme.emeraldGreen;
      statusIcon = Icons.check_circle;
      statusLabel = 'Approved';
    } else if (isRejected) {
      statusColor = AppTheme.primaryRed;
      statusIcon = Icons.cancel;
      statusLabel = 'Rejected';
    } else {
      statusColor = AppTheme.goldYellow;
      statusIcon = Icons.access_time;
      statusLabel = 'Pending';
    }

    final now = DateTime.now();
    final diff = now.difference(record.createdAt);
    String dateStr;
    if (diff.inDays == 0) {
      dateStr = 'Today, ${_formatTime(record.createdAt)}';
    } else if (diff.inDays == 1) {
      dateStr = 'Yesterday, ${_formatTime(record.createdAt)}';
    } else if (diff.inDays < 7) {
      dateStr = '${_dayName(record.createdAt.weekday)}, ${_formatTime(record.createdAt)}';
    } else {
      dateStr = '${record.createdAt.day} ${_monthName(record.createdAt.month)} ${record.createdAt.year}, ${_formatTime(record.createdAt)}';
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
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
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(statusIcon, color: statusColor, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('₹${record.amount.toStringAsFixed(0)}',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                            ),
                            child: Text(statusLabel,
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(dateStr, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(color: Color(0x1FFFFFFF), height: 1),
            const SizedBox(height: 12),
            if (record.bankAccountNumber != null)
              _detailRow('Bank Account', _maskAccount(record.bankAccountNumber!)),
            if (record.upiId != null)
              _detailRow('UPI ID', record.upiId!),
            if (record.utrNumber != null)
              _detailRow('UTR Number', record.utrNumber!),
            if (record.rejectionReason != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(record.rejectionReason!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.primaryRed, fontSize: 12)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium, fontSize: 13)),
          Text(value, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.white, fontSize: 13, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildLoadMoreButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Center(
        child: GestureDetector(
          onTap: () => ref.read(withdrawHistoryScreenProvider.notifier).loadNextPage(),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: Text('Load More',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppTheme.white)),
          ),
        ),
      ),
    );
  }

  Widget _buildShimmerList() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        ShimmerCard(height: 100, borderRadius: 16),
        const SizedBox(height: 20),
        ...List.generate(4, (_) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: ShimmerCard(height: 140, borderRadius: 16),
        )),
      ],
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 80),
          Icon(Icons.receipt_long_outlined, size: 64, color: AppTheme.greyMedium.withValues(alpha: 0.5)),
          const SizedBox(height: 16),
          Text('No withdrawal requests yet',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppTheme.greyMedium)),
          const SizedBox(height: 8),
          Text('Your withdrawal history will appear here',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium.withValues(alpha: 0.6))),
        ],
      ),
    );
  }

  Widget _buildError(Object e) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: AppTheme.primaryRed.withValues(alpha: 0.7)),
            const SizedBox(height: 16),
            Text('Something went wrong',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppTheme.greyMedium)),
            const SizedBox(height: 8),
            Text(e.toString(), style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium.withValues(alpha: 0.6))),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => ref.read(withdrawHistoryScreenProvider.notifier).refresh(),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final min = dt.minute.toString().padLeft(2, '0');
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$min $ampm';
  }

  String _dayName(int weekday) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[weekday - 1];
  }

  String _monthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }

  String _maskAccount(String account) {
    if (account.length < 4) return account;
    return '${'X' * (account.length - 4)}${account.substring(account.length - 4)}';
  }
}
