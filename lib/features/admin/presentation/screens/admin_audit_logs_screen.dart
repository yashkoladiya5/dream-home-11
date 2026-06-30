import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../providers/admin_audit_logs_provider.dart';

class AdminAuditLogsScreen extends ConsumerStatefulWidget {
  const AdminAuditLogsScreen({super.key});

  @override
  ConsumerState<AdminAuditLogsScreen> createState() => _AdminAuditLogsScreenState();
}

class _AdminAuditLogsScreenState extends ConsumerState<AdminAuditLogsScreen> {
  String? _actionFilter;
  int _page = 1;

  @override
  Widget build(BuildContext context) {
    final logsAsync = ref.watch(adminAuditLogsProvider((page: _page, action: _actionFilter)));

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Audit Logs'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: Column(
        children: [
          _buildFilters(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(adminAuditLogsProvider);
              },
              child: logsAsync.when(
                loading: () => ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: 5,
                  itemBuilder: (_, i) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ShimmerCard(height: 80, borderRadius: 16),
                  ),
                ),
                error: (err, stack) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline_rounded, size: 64, color: AppTheme.primaryRed.withValues(alpha: 0.7)),
                      const SizedBox(height: 16),
                      Text('Failed to load', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 16)),
                      const SizedBox(height: 24),
                      ElevatedButton(onPressed: () => ref.invalidate(adminAuditLogsProvider), child: const Text('RETRY')),
                    ],
                  ),
                ),
                data: (data) {
                  final logs = data['logs'] as List<dynamic>? ?? [];
                  if (logs.isEmpty) {
                    return Center(child: Text('No audit logs found', style: GoogleFonts.outfit(color: AppTheme.greyMedium)));
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                    itemCount: logs.length,
                    itemBuilder: (context, index) {
                      final log = logs[index] as Map<String, dynamic>;
                      final action = log['action'] as String? ?? '';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            gradient: AppTheme.darkCardGradient,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0x1FFFFFFF)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 40, height: 40,
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryRed.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(Icons.history_rounded, color: AppTheme.primaryRed, size: 20),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(action.replaceAll('_', ' ').toUpperCase(),
                                      style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12)),
                                    const SizedBox(height: 2),
                                    Text(log['adminName'] as String? ?? 'Unknown',
                                      style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 12)),
                                    if (log['targetId'] != null) ...[
                                      const SizedBox(height: 2),
                                      Text('Target: ${log['targetId']}',
                                        style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 11)),
                                    ],
                                  ],
                                ),
                              ),
                              Text(
                                _formatDate(log['createdAt'] as String?),
                                style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _filterChip('All', null),
            const SizedBox(width: 8),
            _filterChip('Compensate', 'compensate_contest'),
            const SizedBox(width: 8),
            _filterChip('Process Pending', 'process_pending_compensations'),
            const SizedBox(width: 8),
            _filterChip('Approve KYC', 'approve_kyc'),
            const SizedBox(width: 8),
            _filterChip('Reject KYC', 'reject_kyc'),
            const SizedBox(width: 8),
            _filterChip('Broadcast', 'broadcast_notification'),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(String label, String? value) {
    final selected = _actionFilter == value;
    return GestureDetector(
      onTap: () => setState(() { _actionFilter = value; _page = 1; }),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryRed.withValues(alpha: 0.2) : const Color(0x0CFFFFFF),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppTheme.primaryRed : const Color(0x1AFFFFFF)),
        ),
        child: Text(label,
          style: GoogleFonts.outfit(color: selected ? AppTheme.primaryRed : AppTheme.greyMedium,
            fontWeight: FontWeight.w600, fontSize: 12)),
      ),
    );
  }

  String _formatDate(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    return '${dt.day}/${dt.month} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}
