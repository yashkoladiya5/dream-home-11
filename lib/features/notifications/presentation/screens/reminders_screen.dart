import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/reminder_provider.dart';
import '../../../../features/dashboard/presentation/widgets/shimmer_widget.dart';
import 'create_reminder_screen.dart';

class RemindersScreen extends ConsumerStatefulWidget {
  const RemindersScreen({super.key});

  @override
  ConsumerState<RemindersScreen> createState() => _RemindersScreenState();
}

class _RemindersScreenState extends ConsumerState<RemindersScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(remindersProvider.notifier).fetchReminders());
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending':
        return AppTheme.goldYellow;
      case 'sent':
        return AppTheme.emeraldGreen;
      case 'failed':
        return AppTheme.primaryRed;
      default:
        return AppTheme.greyMedium;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'PENDING';
      case 'sent':
        return 'SENT';
      case 'failed':
        return 'FAILED';
      default:
        return status.toUpperCase();
    }
  }

  String _formatDateTime(DateTime dt) {
    final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final minute = dt.minute.toString().padLeft(2, '0');
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[dt.month - 1]} ${dt.day}, $dt.year at $hour:$minute $ampm';
  }

  @override
  Widget build(BuildContext context) {
    final remindersState = ref.watch(remindersProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Reminders'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push<bool>(
            context,
            MaterialPageRoute(builder: (context) => const CreateReminderScreen()),
          );
          if (result == true && mounted) {
            ref.read(remindersProvider.notifier).fetchReminders();
          }
        },
        backgroundColor: AppTheme.primaryRed,
        child: const Icon(Icons.add_rounded, color: Colors.white),
      ),
      body: remindersState.when(
        data: (reminders) {
          if (reminders.isEmpty) {
            return _buildEmptyState();
          }
          return RefreshIndicator(
            onRefresh: () => ref.read(remindersProvider.notifier).fetchReminders(),
            color: AppTheme.primaryRed,
            child: ListView.builder(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
              itemCount: reminders.length,
              itemBuilder: (context, index) => _buildReminderCard(reminders[index]),
            ),
          );
        },
        loading: () => _buildShimmer(),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 48),
                const SizedBox(height: 16),
                Text(
                  'Failed to load reminders',
                  style: Theme.of(context).textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.read(remindersProvider.notifier).fetchReminders(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryRed,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.05),
              ),
              child: const Icon(
                Icons.notifications_none_rounded,
                color: AppTheme.greyMedium,
                size: 36,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'No Reminders',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Set reminders for upcoming contests',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppTheme.greyMedium,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () async {
                final result = await Navigator.push<bool>(
                  context,
                  MaterialPageRoute(builder: (context) => const CreateReminderScreen()),
                );
                if (result == true && mounted) {
                  ref.read(remindersProvider.notifier).fetchReminders();
                }
              },
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('CREATE REMINDER'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReminderCard(dynamic reminder) {
    final theme = Theme.of(context);
    final r = reminder as dynamic;
    final status = r.status as String;
    final remindAt = r.remindAt as DateTime;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppTheme.primaryRed.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.notifications_active_rounded,
                color: AppTheme.primaryRed,
                size: 22,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Contest starting',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatDateTime(remindAt),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: AppTheme.greyMedium,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _statusColor(status).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                _statusLabel(status),
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: _statusColor(status),
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: () => ref.read(remindersProvider.notifier).deleteReminder(r.id as String),
              icon: const Icon(Icons.delete_outline_rounded, size: 20),
              color: AppTheme.greyMedium,
              visualDensity: VisualDensity.compact,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
      itemCount: 5,
      itemBuilder: (context, index) => const Padding(
        padding: EdgeInsets.only(bottom: 12),
        child: ShimmerCard(height: 76, borderRadius: 16),
      ),
    );
  }
}
