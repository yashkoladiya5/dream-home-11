import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../../data/services/admin_api_service.dart';
import '../providers/admin_compensations_provider.dart';

class AdminCompensationsScreen extends ConsumerStatefulWidget {
  const AdminCompensationsScreen({super.key});

  @override
  ConsumerState<AdminCompensationsScreen> createState() => _AdminCompensationsScreenState();
}

class _AdminCompensationsScreenState extends ConsumerState<AdminCompensationsScreen> {
  String? _statusFilter;
  int _page = 1;
  bool _processing = false;
  bool _exporting = false;

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
        actions: [
          IconButton(
            icon: _exporting
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryRed))
                : const Icon(Icons.download_rounded, color: AppTheme.primaryRed),
            onPressed: _exporting ? null : _exportCompensations,
            tooltip: 'Export',
          ),
        ],
      ),
      body: Column(
        children: [
          _buildStatsAndBreakdown(),
          _buildProcessPendingButton(),
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

  Widget _buildProcessPendingButton() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: SizedBox(
        width: double.infinity,
        height: 44,
        child: ElevatedButton.icon(
          onPressed: _processing ? null : _processPending,
          icon: _processing
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.play_arrow_rounded, size: 18),
          label: Text(_processing ? 'Processing...' : 'Process Pending'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.goldYellow,
            foregroundColor: Colors.black,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ),
    );
  }

  Future<void> _processPending() async {
    setState(() => _processing = true);
    try {
      final dio = ref.read(apiClientProvider);
      final service = AdminApiService(dio);
      final result = await service.processPendingCompensations();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Processed: ${result['processed'] ?? 'done'}', style: GoogleFonts.outfit(color: Colors.white)),
            backgroundColor: AppTheme.emeraldGreen,
          ),
        );
        ref.invalidate(adminCompensationsProvider);
        ref.invalidate(adminCompensationStatsProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e', style: GoogleFonts.outfit(color: Colors.white)),
            backgroundColor: AppTheme.primaryRed),
        );
      }
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  Future<void> _exportCompensations() async {
    setState(() => _exporting = true);
    try {
      final dio = ref.read(apiClientProvider);
      final service = AdminApiService(dio);
      await service.exportCompensations(status: _statusFilter);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Export started', style: GoogleFonts.outfit(color: Colors.white)),
            backgroundColor: AppTheme.emeraldGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Export failed: $e', style: GoogleFonts.outfit(color: Colors.white)),
            backgroundColor: AppTheme.primaryRed),
        );
      }
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  Widget _buildStatsAndBreakdown() {
    final statsAsync = ref.watch(adminCompensationStatsProvider);
    return statsAsync.when(
      loading: () => Container(
        margin: const EdgeInsets.all(16),
        height: 80,
        child: const Center(child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryRed)),
      ),
      error: (err, stack) => const SizedBox.shrink(),
      data: (stats) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: AppTheme.darkCardGradient,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0x1FFFFFFF)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _statItem('${stats['total'] ?? 0}', 'Total'),
                  _statItem('${stats['pending'] ?? 0}', 'Pending'),
                  _statItem('${stats['totalPoints'] ?? 0}', 'Points'),
                  _statItem('${(stats['dailyBreakdown'] as List?)?.length ?? 0}', 'Active Days'),
                ],
              ),
            ),
            _buildDailyBreakdown(stats),
          ],
        );
      },
    );
  }

  Widget _buildDailyBreakdown(Map<String, dynamic> stats) {
    final daily = stats['dailyBreakdown'] as List<dynamic>? ?? [];
    if (daily.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 16, 16, 8),
          child: Text(
            'Daily Trend (Last 30 Days)',
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        SizedBox(
          height: 85,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: daily.length,
            itemBuilder: (context, index) {
              final d = daily[index] as Map<String, dynamic>;
              final rawDate = d['date'] as String? ?? '';
              String displayDate = rawDate;
              try {
                if (rawDate.contains('T')) {
                  displayDate = rawDate.split('T')[0];
                }
                final parsed = DateTime.parse(displayDate);
                final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                displayDate = '${months[parsed.month - 1]} ${parsed.day}';
              } catch (_) {}

              final count = d['count'] ?? 0;
              final points = d['points'] ?? 0;

              return Container(
                width: 140,
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: AppTheme.darkCardGradient,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0x1FFFFFFF)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      displayDate,
                      style: GoogleFonts.outfit(
                        color: AppTheme.greyMedium,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$count Compensations',
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '+$points PTS',
                      style: GoogleFonts.outfit(
                        color: AppTheme.goldYellow,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
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
