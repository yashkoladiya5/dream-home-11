import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../providers/admin_dashboard_provider.dart';
import '../../data/models/dashboard_stats.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  @override
  Widget build(BuildContext context) {
    final dashboardAsync = ref.watch(adminDashboardProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(adminDashboardProvider);
          await ref.read(adminDashboardProvider.future);
        },
        child: dashboardAsync.when(
          loading: () => _buildShimmerGrid(),
          error: (err, stack) => Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline_rounded, size: 64, color: AppTheme.primaryRed.withValues(alpha: 0.7)),
                  const SizedBox(height: 16),
                  Text('Something went wrong', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text(err.toString(), style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 13), textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => ref.invalidate(adminDashboardProvider),
                    child: const Text('RETRY'),
                  ),
                ],
              ),
            ),
          ),
          data: (stats) => _buildContent(stats),
        ),
      ),
    );
  }

  Widget _buildContent(DashboardStats stats) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        _buildStatsGrid(stats),
        const SizedBox(height: 24),
        _buildRecentUsers(stats.recentUsers),
        const SizedBox(height: 24),
        _buildRecentTransactions(stats.recentTransactions),
      ],
    );
  }

  Widget _buildStatsGrid(DashboardStats stats) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Overview', style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.6,
          children: [
            _statCard('${stats.totalUsers}', 'Total Users'),
            _statCard('${stats.activeUsers}', 'Active Users'),
            _statCard('${stats.totalContests}', 'Total Contests'),
            _statCard('${stats.runningContests}', 'Running Contests'),
            _statCard('${stats.pendingKycCount}', 'Pending KYC'),
            _statCard('${stats.openSupportTickets}', 'Open Tickets'),
            _statCard('₹${stats.totalDeposits.toStringAsFixed(0)}', 'Total Deposits'),
            _statCard('${stats.totalPointsEarned}', 'Total Points'),
          ],
        ),
      ],
    );
  }

  Widget _statCard(String value, String label) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(value, style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 4),
          Text(label, style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.greyMedium)),
        ],
      ),
    );
  }

  Widget _buildRecentUsers(List<RecentUser> users) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Recent Users', style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        if (users.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: Text('No recent users', style: GoogleFonts.outfit(color: AppTheme.greyMedium)),
          )
        else
          ...users.map((user) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: AppTheme.darkCardGradient,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0x1FFFFFFF)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppTheme.primaryRed.withValues(alpha: 0.2),
                    child: Text(
                      (user.fullName ?? user.phoneNumber)[0].toUpperCase(),
                      style: GoogleFonts.outfit(color: AppTheme.primaryRed, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user.fullName ?? user.phoneNumber, style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 14)),
                        if (user.fullName != null)
                          Text(user.phoneNumber, style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 12)),
                      ],
                    ),
                  ),
                  _tierBadge(user.currentTier),
                ],
              ),
            ),
          )),
      ],
    );
  }

  Widget _buildRecentTransactions(List<RecentTransaction> transactions) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Recent Transactions', style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        if (transactions.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: Text('No recent transactions', style: GoogleFonts.outfit(color: AppTheme.greyMedium)),
          )
        else
          ...transactions.map((txn) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: AppTheme.darkCardGradient,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0x1FFFFFFF)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: _txnColor(txn.status).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(_txnIcon(txn.type), color: _txnColor(txn.status), size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${txn.type.toUpperCase()} - ₹${txn.amount.toStringAsFixed(0)}', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 14)),
                        if (txn.userPhoneNumber != null)
                          Text(txn.userPhoneNumber!, style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 12)),
                      ],
                    ),
                  ),
                  _txnStatusBadge(txn.status),
                ],
              ),
            ),
          )),
      ],
    );
  }

  Widget _tierBadge(String tier) {
    final Color color;
    switch (tier.toLowerCase()) {
      case 'bronze':
        color = const Color(0xFFCD7F32);
      case 'silver':
        color = AppTheme.greyLight;
      case 'gold':
        color = AppTheme.goldYellow;
      case 'platinum':
        color = const Color(0xFFE5E4E2);
      default:
        color = AppTheme.greyMedium;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(tier.toUpperCase(), style: GoogleFonts.outfit(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }

  Widget _txnStatusBadge(String status) {
    final Color color = _txnColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(status.toUpperCase(), style: GoogleFonts.outfit(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }

  Color _txnColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return AppTheme.emeraldGreen;
      case 'pending':
        return AppTheme.goldYellow;
      case 'failed':
      case 'rejected':
        return AppTheme.primaryRed;
      default:
        return AppTheme.greyMedium;
    }
  }

  IconData _txnIcon(String type) {
    switch (type.toLowerCase()) {
      case 'deposit':
        return Icons.arrow_downward_rounded;
      case 'withdrawal':
        return Icons.arrow_upward_rounded;
      case 'referral':
        return Icons.share_rounded;
      case 'contest_fee':
        return Icons.sports_esports_rounded;
      case 'winning':
        return Icons.emoji_events_rounded;
      default:
        return Icons.receipt_long_rounded;
    }
  }

  Widget _buildShimmerGrid() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        ShimmerLine(width: 140, height: 20, margin: const EdgeInsets.only(bottom: 12)),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.6,
          children: List.generate(6, (_) => const ShimmerCard(height: 100, borderRadius: 16)),
        ),
        const SizedBox(height: 24),
        ShimmerLine(width: 140, height: 20, margin: const EdgeInsets.only(bottom: 12)),
        ...List.generate(3, (_) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: ShimmerCard(height: 68, borderRadius: 16),
        )),
      ],
    );
  }
}
