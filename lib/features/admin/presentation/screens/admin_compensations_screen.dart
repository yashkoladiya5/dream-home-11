import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../providers/admin_compensations_provider.dart';

class AdminCompensationsScreen extends ConsumerStatefulWidget {
  const AdminCompensationsScreen({super.key});

  @override
  ConsumerState<AdminCompensationsScreen> createState() => _AdminCompensationsScreenState();
}

class _AdminCompensationsScreenState extends ConsumerState<AdminCompensationsScreen> {
  String? _statusFilter;
  int _page = 1;

  @override
  Widget build(BuildContext context) {
    final compensationsAsync = ref.watch(adminCompensationsProvider((page: _page, status: _statusFilter)));

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Compensations'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: Column(
        children: [
          _buildStatsCard(),
          _buildFilters(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(adminCompensationsProvider);
                await ref.read(adminCompensationsProvider((page: _page, status: _statusFilter)).future);
              },
              child: compensationsAsync.when(
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
                      ElevatedButton(
                        onPressed: () => ref.invalidate(adminCompensationsProvider),
                        child: const Text('RETRY'),
                      ),
                    ],
                  ),
                ),
                data: (data) {
                  final logs = data['logs'] as List<dynamic>? ?? [];
                  if (logs.isEmpty) {
                    return Center(
                      child: Text('No compensation logs found', style: GoogleFonts.outfit(color: AppTheme.greyMedium)),
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                    itemCount: logs.length,
                    itemBuilder: (context, index) {
                      final log = logs[index] as Map<String, dynamic>;
                      final status = log['status'] as String? ?? '';
                      final isProcessed = status == 'processed';
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
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: (isProcessed ? AppTheme.emeraldGreen : AppTheme.goldYellow).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  isProcessed ? Icons.check_circle_rounded : Icons.pending_rounded,
                                  color: isProcessed ? AppTheme.emeraldGreen : AppTheme.goldYellow,
                                  size: 22,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      log['contestTitle'] as String? ?? 'Unknown',
                                      style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      log['userName'] as String? ?? 'Unknown',
                                      style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '+${log['compensationPoints']} PTS',
                                    style: GoogleFonts.outfit(color: AppTheme.goldYellow, fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '\u20B9${(log['entryFeeInr'] as num?)?.toStringAsFixed(0) ?? '0'}',
                                    style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 11),
                                  ),
                                ],
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

  Widget _buildStatsCard() {
    final statsAsync = ref.watch(adminCompensationStatsProvider);
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: statsAsync.when(
        loading: () => const SizedBox(height: 40, child: Center(child: CircularProgressIndicator(strokeWidth: 2))),
        error: (_, _) => const SizedBox.shrink(),
        data: (stats) {
          return Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _statItem('${stats['total'] ?? 0}', 'Total'),
              _statItem('${stats['pending'] ?? 0}', 'Pending'),
              _statItem('${stats['totalPoints'] ?? 0}', 'Points'),
              _statItem('${stats['total'] is int ? (stats['total'] as int) : 0}', 'Logs'),
            ],
          );
        },
      ),
    );
  }

  Widget _statItem(String value, String label) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.outfit(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(label, style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 11)),
      ],
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
            _filterChip('Processed', 'processed'),
            const SizedBox(width: 8),
            _filterChip('Pending', 'pending'),
            const SizedBox(width: 8),
            _filterChip('Failed', 'failed'),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(String label, String? value) {
    final selected = _statusFilter == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _statusFilter = value;
          _page = 1;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryRed.withValues(alpha: 0.2) : const Color(0x0CFFFFFF),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppTheme.primaryRed : const Color(0x1AFFFFFF)),
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            color: selected ? AppTheme.primaryRed : AppTheme.greyMedium,
            fontWeight: FontWeight.w600,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}
