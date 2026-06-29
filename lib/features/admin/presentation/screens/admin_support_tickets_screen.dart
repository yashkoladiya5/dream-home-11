import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../providers/admin_support_provider.dart';

class AdminSupportTicketsScreen extends ConsumerStatefulWidget {
  const AdminSupportTicketsScreen({super.key});

  @override
  ConsumerState<AdminSupportTicketsScreen> createState() => _AdminSupportTicketsScreenState();
}

class _AdminSupportTicketsScreenState extends ConsumerState<AdminSupportTicketsScreen> {
  static const _filters = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];
  static const _filterValues = [null, 'open', 'in_progress', 'resolved', 'closed'];

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(adminSupportProvider.notifier).loadTickets());
  }

  void _showTicketDetail(Map<String, dynamic> ticket) {
    final category = ticket['category'] as String? ?? '';
    final subject = ticket['subject'] as String? ?? '';
    final message = ticket['message'] as String? ?? '';
    final userPhone = ticket['userPhone'] as String? ?? '';
    final createdAt = ticket['createdAt'] as String? ?? '';
    final dateStr = createdAt.isNotEmpty ? createdAt.split('T')[0] : '';

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.secondarySlate,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.greyMedium.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(subject, style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            if (userPhone.isNotEmpty) ...[
              _detailRow(Icons.phone_rounded, userPhone),
              const SizedBox(height: 6),
            ],
            if (category.isNotEmpty) ...[
              _detailRow(Icons.category_rounded, category),
              const SizedBox(height: 6),
            ],
            if (dateStr.isNotEmpty) ...[
              _detailRow(Icons.calendar_today_rounded, dateStr),
              const SizedBox(height: 6),
            ],
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.darkSlate,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                message.isNotEmpty ? message : 'No message content',
                style: GoogleFonts.outfit(color: AppTheme.greyLight, fontSize: 14, height: 1.5),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppTheme.greyMedium),
        const SizedBox(width: 8),
        Text(text, style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 13)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(adminSupportProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Support Tickets'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(adminSupportProvider.notifier).loadTickets(refresh: true),
        child: state.isLoading && state.tickets.isEmpty
            ? _buildShimmerList()
            : _buildContent(state),
      ),
    );
  }

  Widget _buildContent(AdminSupportState state) {
    return Column(
      children: [
        _buildFilterChips(state),
        if (state.error != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text(state.error!, style: GoogleFonts.outfit(color: AppTheme.primaryRed, fontSize: 13)),
          ),
        Expanded(
          child: state.tickets.isEmpty
              ? _buildEmpty()
              : ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: state.tickets.length,
                  itemBuilder: (context, index) => _buildTicketItem(state.tickets[index]),
                ),
        ),
      ],
    );
  }

  Widget _buildFilterChips(AdminSupportState state) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Row(
        children: List.generate(_filters.length, (i) {
          final isSelected = state.statusFilter == _filterValues[i];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => ref.read(adminSupportProvider.notifier).setStatusFilter(_filterValues[i]),
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
                  _filters[i],
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

  Widget _buildTicketItem(Map<String, dynamic> ticket) {
    final status = (ticket['status'] as String? ?? 'open').toLowerCase();
    final subject = ticket['subject'] as String? ?? '';
    final category = ticket['category'] as String? ?? '';
    final userPhone = ticket['userPhone'] as String? ?? '';
    final message = ticket['message'] as String? ?? '';
    final createdAt = ticket['createdAt'] as String? ?? '';
    final dateStr = createdAt.isNotEmpty ? createdAt.split('T')[0] : '';

    final Color statusColor;
    final String statusLabel;
    switch (status) {
      case 'open':
        statusColor = AppTheme.primaryRed;
        statusLabel = 'Open';
      case 'in_progress':
        statusColor = AppTheme.goldYellow;
        statusLabel = 'In Progress';
      case 'resolved':
        statusColor = AppTheme.emeraldGreen;
        statusLabel = 'Resolved';
      case 'closed':
        statusColor = AppTheme.greyMedium;
        statusLabel = 'Closed';
      default:
        statusColor = AppTheme.greyMedium;
        statusLabel = status;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(
        onTap: () => _showTicketDetail(ticket),
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      subject,
                      style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
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
                  if (userPhone.isNotEmpty) ...[
                    Icon(Icons.phone_rounded, size: 14, color: AppTheme.greyMedium),
                    const SizedBox(width: 4),
                    Text(userPhone, style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 13)),
                    const SizedBox(width: 16),
                  ],
                  if (category.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryRed.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(category, style: GoogleFonts.outfit(color: AppTheme.primaryRed, fontSize: 11, fontWeight: FontWeight.w500)),
                    ),
                ],
              ),
              if (message.isNotEmpty || dateStr.isNotEmpty) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (message.isNotEmpty) ...[
                      Expanded(
                        child: Text(
                          message,
                          style: GoogleFonts.outfit(color: AppTheme.greyMedium.withValues(alpha: 0.7), fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    if (dateStr.isNotEmpty)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.calendar_today_rounded, size: 12, color: AppTheme.greyMedium),
                          const SizedBox(width: 4),
                          Text(dateStr, style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 12)),
                        ],
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.support_agent_outlined, size: 64, color: AppTheme.greyMedium.withValues(alpha: 0.5)),
          const SizedBox(height: 16),
          Text('No support tickets', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildShimmerList() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: List.generate(5, (_) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: ShimmerCard(height: 120, borderRadius: 16),
      )),
    );
  }
}
