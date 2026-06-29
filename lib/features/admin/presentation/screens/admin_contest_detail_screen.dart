import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../providers/admin_dashboard_provider.dart';
import '../../data/models/admin_contest.dart';

final _contestDetailProvider = FutureProvider.family<AdminContestDetail, String>((ref, contestId) async {
  final service = ref.watch(adminApiServiceProvider);
  final result = await service.getContestById(contestId);
  return AdminContestDetail.fromJson(result);
});

class AdminContestDetailScreen extends ConsumerStatefulWidget {
  final String contestId;

  const AdminContestDetailScreen({super.key, required this.contestId});

  @override
  ConsumerState<AdminContestDetailScreen> createState() => _AdminContestDetailScreenState();
}

class _AdminContestDetailScreenState extends ConsumerState<AdminContestDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final contestAsync = ref.watch(_contestDetailProvider(widget.contestId));

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Contest Details'),
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
          ref.invalidate(_contestDetailProvider(widget.contestId));
          await ref.read(_contestDetailProvider(widget.contestId).future);
        },
        child: contestAsync.when(
          loading: () => _buildShimmer(),
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
                    onPressed: () => ref.invalidate(_contestDetailProvider(widget.contestId)),
                    child: const Text('RETRY'),
                  ),
                ],
              ),
            ),
          ),
          data: (contest) => _buildContent(contest),
        ),
      ),
    );
  }

  Widget _buildContent(AdminContestDetail contest) {
    final Color statusColor;
    switch (contest.status.toLowerCase()) {
      case 'running':
        statusColor = AppTheme.emeraldGreen;
      case 'upcoming':
        statusColor = AppTheme.goldYellow;
      case 'completed':
      default:
        statusColor = AppTheme.greyMedium;
    }

    final progress = contest.totalSlots > 0
        ? contest.filledSlots / contest.totalSlots
        : 0.0;

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        _headerCard(contest, statusColor),
        const SizedBox(height: 16),
        _infoRow('Status', contest.status.toUpperCase(), statusColor),
        _infoRow('Type', contest.type.toUpperCase(), null),
        const SizedBox(height: 16),
        _statsCard(contest, progress, statusColor),
        if (contest.startTime != null || contest.endTime != null) ...[
          const SizedBox(height: 16),
          _datesCard(contest),
        ],
        if (contest.description != null && contest.description!.isNotEmpty) ...[
          const SizedBox(height: 16),
          _sectionCard('Description', contest.description!),
        ],
        if (contest.rules != null && contest.rules!.isNotEmpty) ...[
          const SizedBox(height: 16),
          _rulesCard(contest.rules!),
        ],
      ],
    );
  }

  Widget _headerCard(AdminContestDetail contest, Color statusColor) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
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
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.primaryRed.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(Icons.sports_esports_rounded, color: AppTheme.primaryRed, size: 26),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      contest.title,
                      style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        contest.status.toUpperCase(),
                        style: GoogleFonts.outfit(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value, Color? valueColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 90,
            child: Text(label, style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 14)),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.outfit(
                color: valueColor ?? Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statsCard(AdminContestDetail contest, double progress, Color statusColor) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Stats', style: GoogleFonts.outfit(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: _statTile('Entry Fee', '₹${contest.entryFeeDisplay}')),
              Expanded(child: _statTile('Prize Pool', contest.prizeDisplay)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _statTile('Members', '${contest.memberCount}')),
              Expanded(child: _statTile('Slots', '${contest.filledSlots}/${contest.totalSlots}')),
            ],
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: AppTheme.greyDark,
              valueColor: AlwaysStoppedAnimation<Color>(statusColor),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${(progress * 100).toStringAsFixed(0)}% filled',
            style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _statTile(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 12)),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _datesCard(AdminContestDetail contest) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Schedule', style: GoogleFonts.outfit(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 14),
          if (contest.startTime != null)
            _dateRow('Starts', contest.startTime!),
          if (contest.endTime != null) ...[
            const SizedBox(height: 8),
            _dateRow('Ends', contest.endTime!),
          ],
        ],
      ),
    );
  }

  Widget _dateRow(String label, DateTime date) {
    return Row(
      children: [
        Icon(Icons.calendar_today_rounded, size: 16, color: AppTheme.greyMedium),
        const SizedBox(width: 8),
        Text(label, style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 13)),
        const SizedBox(width: 8),
        Text(
          '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}',
          style: GoogleFonts.outfit(color: Colors.white, fontSize: 13),
        ),
      ],
    );
  }

  Widget _sectionCard(String title, String body) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.outfit(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          Text(body, style: GoogleFonts.outfit(color: AppTheme.greyLight, fontSize: 13, height: 1.5)),
        ],
      ),
    );
  }

  Widget _rulesCard(String rules) {
    final lines = rules.split('\n').where((l) => l.trim().isNotEmpty).toList();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Rules', style: GoogleFonts.outfit(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          ...lines.asMap().entries.map((entry) => Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${entry.key + 1}. ', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 13)),
                Expanded(
                  child: Text(entry.value, style: GoogleFonts.outfit(color: AppTheme.greyLight, fontSize: 13, height: 1.5)),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildShimmer() {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        ShimmerCard(height: 76, borderRadius: 16),
        const SizedBox(height: 16),
        ...List.generate(2, (_) => Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: ShimmerLine(height: 18, borderRadius: 6),
        )),
        const SizedBox(height: 16),
        ShimmerCard(height: 180, borderRadius: 16),
        const SizedBox(height: 16),
        ShimmerCard(height: 100, borderRadius: 16),
        const SizedBox(height: 16),
        ShimmerCard(height: 120, borderRadius: 16),
      ],
    );
  }
}
