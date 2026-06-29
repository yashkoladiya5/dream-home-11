import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../providers/compensation_provider.dart';

class CompensationHistoryScreen extends ConsumerWidget {
  const CompensationHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final compensationsAsync = ref.watch(myCompensationsProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Compensation History'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(myCompensationsProvider);
          await ref.read(myCompensationsProvider.future);
        },
        child: compensationsAsync.when(
          loading: () => ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: 5,
            itemBuilder: (_, _) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ShimmerCard(height: 100, borderRadius: 16),
            ),
          ),
          error: (err, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline_rounded, size: 64, color: AppTheme.primaryRed.withValues(alpha: 0.7)),
                const SizedBox(height: 16),
                Text('Failed to load compensations', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 16)),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => ref.invalidate(myCompensationsProvider),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
          data: (compensations) {
            if (compensations.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.card_giftcard_rounded, size: 72, color: AppTheme.greyMedium.withValues(alpha: 0.4)),
                    const SizedBox(height: 16),
                    Text('No compensations yet', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 16)),
                    const SizedBox(height: 8),
                    Text('Points from cancelled contests will appear here', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 13), textAlign: TextAlign.center),
                  ],
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              itemCount: compensations.length,
              itemBuilder: (context, index) {
                final log = compensations[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: AppTheme.darkCardGradient,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0x1FFFFFFF)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: log.status == 'processed'
                                ? AppTheme.emeraldGreen.withValues(alpha: 0.15)
                                : AppTheme.goldYellow.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(
                            log.status == 'processed'
                                ? Icons.check_circle_rounded
                                : Icons.pending_rounded,
                            color: log.status == 'processed'
                                ? AppTheme.emeraldGreen
                                : AppTheme.goldYellow,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                log.contestTitle ?? 'Unknown Contest',
                                style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Entry: \u20B9${log.entryFeeInr.toStringAsFixed(0)}',
                                style: GoogleFonts.outfit(
                                  color: AppTheme.greyMedium,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '+${log.compensationPoints} PTS',
                              style: GoogleFonts.outfit(
                                color: AppTheme.goldYellow,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              log.status == 'processed' ? 'Processed' : 'Pending',
                              style: GoogleFonts.outfit(
                                color: log.status == 'processed'
                                    ? AppTheme.emeraldGreen
                                    : AppTheme.goldYellow,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
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
    );
  }
}
