import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../../data/models/notification_log.dart';
import '../providers/notifications_provider.dart';

class NotificationInboxScreen extends ConsumerWidget {
  const NotificationInboxScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Notification Inbox'),
        backgroundColor: AppTheme.darkSlate,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          notificationsAsync.maybeWhen(
            data: (list) {
              final hasUnread = list.any((n) => !n.isRead);
              if (!hasUnread) return const SizedBox.shrink();
              return TextButton.icon(
                onPressed: () => ref.read(notificationsProvider.notifier).readAll(),
                icon: const Icon(Icons.done_all_rounded, size: 16, color: AppTheme.primaryRed),
                label: Text(
                  'Mark All Read',
                  style: GoogleFonts.outfit(
                    color: AppTheme.primaryRed,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              );
            },
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(notificationsProvider.notifier).fetchNotifications();
        },
        child: notificationsAsync.when(
          loading: () => ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: 6,
            itemBuilder: (context, index) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: ShimmerCard(height: 90, borderRadius: 16),
            ),
          ),
          error: (err, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline_rounded, size: 64, color: AppTheme.primaryRed.withValues(alpha: 0.7)),
                const SizedBox(height: 16),
                Text('Failed to load notifications', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 16)),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => ref.invalidate(notificationsProvider),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
          data: (List<NotificationLog> notifications) {
            if (notifications.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.notifications_off_rounded, size: 72, color: AppTheme.greyMedium.withValues(alpha: 0.4)),
                    const SizedBox(height: 16),
                    Text('Your inbox is empty', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('Transactional and updates logs will appear here', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 13), textAlign: TextAlign.center),
                  ],
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final log = notifications[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    onTap: log.isRead ? null : () => ref.read(notificationsProvider.notifier).markAsRead(log.id),
                    borderRadius: BorderRadius.circular(16),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: AppTheme.darkCardGradient,
                        color: log.isRead ? Colors.transparent : Colors.white.withValues(alpha: 0.02),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: log.isRead 
                              ? const Color(0x1FFFFFFF) 
                              : AppTheme.primaryRed.withValues(alpha: 0.3),
                          width: log.isRead ? 1.0 : 1.2,
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: _getIconColor(log.type).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              _getIconData(log.type),
                              color: _getIconColor(log.type),
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        log.title,
                                        style: GoogleFonts.outfit(
                                          color: Colors.white,
                                          fontWeight: log.isRead ? FontWeight.w600 : FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (!log.isRead)
                                      Container(
                                        width: 6,
                                        height: 6,
                                        decoration: const BoxDecoration(
                                          color: AppTheme.primaryRed,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  log.body,
                                  style: GoogleFonts.outfit(
                                    color: log.isRead ? AppTheme.greyMedium : AppTheme.greyLight,
                                    fontSize: 12,
                                    height: 1.3,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _formatTime(log.createdAt),
                                  style: GoogleFonts.outfit(
                                    color: AppTheme.greyMedium,
                                    fontSize: 10,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
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

  IconData _getIconData(String type) {
    switch (type.toLowerCase()) {
      case 'compensation':
        return Icons.card_giftcard_rounded;
      case 'kyc':
        return Icons.verified_user_rounded;
      case 'payment':
        return Icons.account_balance_wallet_rounded;
      case 'broadcast':
        return Icons.campaign_rounded;
      case 'contest_reminder':
        return Icons.alarm_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _getIconColor(String type) {
    switch (type.toLowerCase()) {
      case 'compensation':
        return AppTheme.goldYellow;
      case 'kyc':
        return AppTheme.emeraldGreen;
      case 'payment':
        return Colors.blue;
      case 'broadcast':
        return Colors.orange;
      case 'contest_reminder':
        return AppTheme.primaryRed;
      default:
        return Colors.white;
    }
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inMinutes < 60) {
      if (difference.inMinutes <= 0) return 'Just now';
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[time.month - 1]} ${time.day}';
    }
  }
}
