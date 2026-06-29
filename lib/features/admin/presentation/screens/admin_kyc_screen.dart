import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../providers/admin_kyc_provider.dart';

class AdminKycScreen extends ConsumerStatefulWidget {
  const AdminKycScreen({super.key});

  @override
  ConsumerState<AdminKycScreen> createState() => _AdminKycScreenState();
}

class _AdminKycScreenState extends ConsumerState<AdminKycScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(adminKycProvider.notifier).loadSubmissions());
  }

  Future<void> _showRejectDialog(String id) async {
    final reasonController = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.secondarySlate,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Reject KYC', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w600)),
        content: TextField(
          controller: reasonController,
          style: GoogleFonts.outfit(color: Colors.white),
          maxLines: 3,
          decoration: InputDecoration(
            hintText: 'Enter rejection reason...',
            hintStyle: GoogleFonts.outfit(color: AppTheme.greyMedium),
            filled: true,
            fillColor: AppTheme.darkSlate,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(null),
            child: Text('Cancel', style: GoogleFonts.outfit(color: AppTheme.greyMedium)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(reasonController.text.trim()),
            child: Text('Reject', style: GoogleFonts.outfit(color: AppTheme.primaryRed, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
    if (reason != null && mounted) {
      await ref.read(adminKycProvider.notifier).rejectKyc(id, reason: reason);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(adminKycProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('KYC Approvals'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(adminKycProvider.notifier).loadSubmissions(refresh: true),
        child: state.isLoading && state.submissions.isEmpty
            ? _buildShimmerList()
            : _buildContent(state),
      ),
    );
  }

  Widget _buildContent(AdminKycState state) {
    return Column(
      children: [
        _buildFilterChips(state),
        if (state.error != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text(state.error!, style: GoogleFonts.outfit(color: AppTheme.primaryRed, fontSize: 13)),
          ),
        Expanded(
          child: state.submissions.isEmpty
              ? _buildEmpty()
              : ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: state.submissions.length,
                  itemBuilder: (context, index) => _buildKycItem(state.submissions[index]),
                ),
        ),
      ],
    );
  }

  Widget _buildFilterChips(AdminKycState state) {
    final filters = ['All', 'Pending', 'Approved', 'Rejected'];
    final filterValues = [null, 'pending', 'approved', 'rejected'];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Row(
        children: List.generate(filters.length, (i) {
          final isSelected = state.statusFilter == filterValues[i];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => ref.read(adminKycProvider.notifier).setStatusFilter(filterValues[i]),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primaryRed : AppTheme.secondarySlate,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected ? AppTheme.primaryRed : AppTheme.greyDark,
                  ),
                ),
                child: Text(
                  filters[i],
                  style: GoogleFonts.outfit(
                    color: isSelected ? Colors.white : AppTheme.greyMedium,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildKycItem(Map<String, dynamic> submission) {
    final status = (submission['status'] as String? ?? 'pending').toLowerCase();
    final type = (submission['type'] as String? ?? 'unknown').toUpperCase();
    final number = submission['number'] as String? ?? '';
    final maskedNumber = number.length > 4 ? 'XXXX${number.substring(number.length - 4)}' : 'XXXX';
    final createdAt = submission['createdAt'] as String? ?? '';
    final dateStr = createdAt.isNotEmpty ? createdAt.split('T')[0] : '';
    final user = submission['user'] as Map<String, dynamic>?;
    final userName = user?['fullName'] as String? ?? user?['phoneNumber'] as String? ?? 'Unknown';
    final userPhone = user?['phoneNumber'] as String? ?? '';

    final Color statusColor;
    final String statusLabel;
    switch (status) {
      case 'approved':
        statusColor = AppTheme.emeraldGreen;
        statusLabel = 'Approved';
      case 'rejected':
        statusColor = AppTheme.primaryRed;
        statusLabel = 'Rejected';
      default:
        statusColor = AppTheme.goldYellow;
        statusLabel = 'Pending';
    }

    final isPending = status == 'pending';

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(14),
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
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppTheme.primaryRed.withValues(alpha: 0.2),
                  child: Text(
                    userName[0].toUpperCase(),
                    style: GoogleFonts.outfit(color: AppTheme.primaryRed, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(userName, style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 14)),
                      if (userPhone.isNotEmpty)
                        Text(userPhone, style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 12)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                  ),
                  child: Text(statusLabel, style: GoogleFonts.outfit(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(Icons.assignment_rounded, size: 14, color: AppTheme.greyMedium),
                const SizedBox(width: 6),
                Text('$type - $maskedNumber', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 13)),
              ],
            ),
            if (dateStr.isNotEmpty) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.calendar_today_rounded, size: 14, color: AppTheme.greyMedium),
                  const SizedBox(width: 6),
                  Text(dateStr, style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 13)),
                ],
              ),
            ],
            if (submission['rejectionReason'] != null) ...[
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.primaryRed.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline_rounded, size: 14, color: AppTheme.primaryRed),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        submission['rejectionReason'] as String,
                        style: GoogleFonts.outfit(color: AppTheme.primaryRed, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (isPending) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 38,
                      child: ElevatedButton(
                        onPressed: () async {
                          final success = await ref.read(adminKycProvider.notifier)
                              .approveKyc(submission['id'] as String);
                          if (mounted && success) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: const Text('KYC approved successfully'),
                                backgroundColor: AppTheme.emeraldGreen,
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.emeraldGreen,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 0),
                        ),
                        child: Text('Approve', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: SizedBox(
                      height: 38,
                      child: OutlinedButton(
                        onPressed: () => _showRejectDialog(submission['id'] as String),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.primaryRed,
                          side: const BorderSide(color: AppTheme.primaryRed),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 0),
                        ),
                        child: Text('Reject', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.verified_user_outlined, size: 64, color: AppTheme.greyMedium.withValues(alpha: 0.5)),
          const SizedBox(height: 16),
          Text('No KYC submissions', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildShimmerList() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: List.generate(5, (_) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: ShimmerCard(height: 150, borderRadius: 16),
      )),
    );
  }
}
