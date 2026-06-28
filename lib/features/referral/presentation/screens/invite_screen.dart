import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/referral_provider.dart';
import '../../data/models/referral_stats.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class InviteScreen extends ConsumerStatefulWidget {
  const InviteScreen({super.key});

  @override
  ConsumerState<InviteScreen> createState() => _InviteScreenState();
}

class _InviteScreenState extends ConsumerState<InviteScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.invalidate(referralStatsProvider));
    Future.microtask(() => ref.invalidate(referralHistoryProvider));
  }

  Future<void> _shareReferral(String code, String channel) async {
    const appName = 'Dream Home 11';
    final shareText = 'Join me on $appName and start winning dream homes!\n\nUse my referral code: $code\n\nDownload now and get bonus points!';

    try {
      switch (channel) {
        case 'copy':
          await Clipboard.setData(ClipboardData(text: code));
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Referral code copied!'),
                backgroundColor: AppTheme.emeraldGreen,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
          break;
        case 'whatsapp':
          final uri = Uri.parse('whatsapp://send?text=${Uri.encodeComponent(shareText)}');
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri);
          } else {
            await Share.share(shareText, subject: 'Dream Home 11');
          }
          break;
        case 'telegram':
          final uri = Uri.parse('tg://msg?text=${Uri.encodeComponent(shareText)}');
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri);
          } else {
            await Share.share(shareText, subject: 'Dream Home 11');
          }
          break;
        case 'sms':
          final uri = Uri.parse('sms:?body=${Uri.encodeComponent(shareText)}');
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri);
          } else {
            await Share.share(shareText, subject: 'Dream Home 11');
          }
          break;
        default:
          await Share.share(shareText, subject: 'Dream Home 11');
      }
    } catch (_) {
      await Share.share(shareText, subject: 'Dream Home 11');
    }
  }

  @override
  Widget build(BuildContext context) {
    final statsAsync = ref.watch(referralStatsProvider);
    final historyAsync = ref.watch(referralHistoryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Invite Friends'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(referralStatsProvider);
          ref.invalidate(referralHistoryProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              statsAsync.when(
                data: (stats) => _buildReferralCodeCard(context, stats),
                loading: () => const ShimmerCard(height: 120, borderRadius: 16),
                error: (_, _) => _buildErrorRetry(),
              ),
              const SizedBox(height: 20),
              statsAsync.when(
                data: (stats) => _buildStatsRow(stats),
                loading: () => const Row(
                  children: [
                    Expanded(child: ShimmerCard(height: 80, borderRadius: 16)),
                    SizedBox(width: 12),
                    Expanded(child: ShimmerCard(height: 80, borderRadius: 16)),
                  ],
                ),
                error: (_, _) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 24),
              _buildSectionTitle('Share Via'),
              const SizedBox(height: 12),
              _buildShareOptions(context, statsAsync.whenOrNull(data: (s) => s.referralCode) ?? '------'),
              const SizedBox(height: 24),
              _buildSectionTitle('Referral History'),
              const SizedBox(height: 12),
              historyAsync.when(
                data: (history) {
                  if (history.isEmpty) {
                    return _buildEmptyHistory();
                  }
                  return _buildHistoryList(history);
                },
                loading: () => const Column(
                  children: [
                    ShimmerCard(height: 72, borderRadius: 12),
                    SizedBox(height: 8),
                    ShimmerCard(height: 72, borderRadius: 12),
                    SizedBox(height: 8),
                    ShimmerCard(height: 72, borderRadius: 12),
                  ],
                ),
                error: (_, _) => _buildErrorRetry(),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReferralCodeCard(BuildContext context, ReferralStats stats) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        children: [
          Text(
            'Your Referral Code',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              color: AppTheme.greyMedium,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            decoration: BoxDecoration(
              color: AppTheme.darkSlate,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.goldYellow.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  stats.referralCode,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    letterSpacing: 4,
                    color: AppTheme.goldYellow,
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: () => _shareReferral(stats.referralCode, 'copy'),
                  child: Icon(Icons.copy_rounded, color: AppTheme.goldYellow, size: 22),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Share your code & earn 30 points per referral!\n+50 points when they complete KYC',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppTheme.greyMedium,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(ReferralStats stats) {
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: Column(
              children: [
                Icon(Icons.people_rounded, color: AppTheme.primaryRed, size: 28),
                const SizedBox(height: 8),
                Text(
                  '${stats.totalReferred}',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'Referred',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.greyMedium,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: Column(
              children: [
                Icon(Icons.emoji_events_rounded, color: AppTheme.goldYellow, size: 28),
                const SizedBox(height: 8),
                Text(
                  '${stats.totalRewardsEarned}',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'Points Earned',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.greyMedium,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildShareOptions(BuildContext context, String code) {
    final shares = [
      {'label': 'WhatsApp', 'icon': Icons.chat_rounded, 'color': const Color(0xFF25D366), 'channel': 'whatsapp'},
      {'label': 'Telegram', 'icon': Icons.send_rounded, 'color': const Color(0xFF0088CC), 'channel': 'telegram'},
      {'label': 'SMS', 'icon': Icons.sms_rounded, 'color': AppTheme.primaryRed, 'channel': 'sms'},
      {'label': 'Copy Code', 'icon': Icons.copy_rounded, 'color': AppTheme.goldYellow, 'channel': 'copy'},
    ];

    return Row(
      children: shares.map((s) {
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: GestureDetector(
              onTap: () => _shareReferral(code, s['channel'] as String),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  gradient: AppTheme.darkCardGradient,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0x1FFFFFFF)),
                ),
                child: Column(
                  children: [
                    Icon(s['icon'] as IconData, color: s['color'] as Color, size: 28),
                    const SizedBox(height: 6),
                    Text(
                      s['label'] as String,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.greyMedium,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildHistoryList(List<ReferralHistoryItem> history) {
    return Column(
      children: history.map((item) => _buildHistoryItem(item)).toList(),
    );
  }

  Widget _buildHistoryItem(ReferralHistoryItem item) {
    final isSettled = item.status == 'settled';
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: AppTheme.darkSlate,
            child: item.refereeName != null
                ? Text(
                    item.refereeName!.substring(0, 1).toUpperCase(),
                    style: const TextStyle(color: AppTheme.goldYellow, fontWeight: FontWeight.w700),
                  )
                : const Icon(Icons.person_rounded, color: AppTheme.greyMedium, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.refereeName ?? 'Friend',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                ),
                Text(
                  _formatDate(item.createdAt),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '+${item.signupReward + item.kycReward} pts',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppTheme.emeraldGreen,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: isSettled ? AppTheme.emeraldGreen.withValues(alpha: 0.2) : AppTheme.goldYellow.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isSettled ? 'KYC Done' : 'Pending',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: isSettled ? AppTheme.emeraldGreen : AppTheme.goldYellow,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyHistory() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        children: [
          Icon(Icons.person_add_rounded, color: AppTheme.greyMedium, size: 48),
          const SizedBox(height: 12),
          Text(
            'No referrals yet',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppTheme.greyMedium),
          ),
          const SizedBox(height: 4),
          Text(
            'Share your code and earn rewards!',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.greyMedium),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorRetry() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        children: [
          const Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed, size: 48),
          const SizedBox(height: 12),
          Text(
            'Failed to load',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppTheme.greyMedium),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: () {
              ref.invalidate(referralStatsProvider);
              ref.invalidate(referralHistoryProvider);
            },
            child: const Text('RETRY'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inDays == 0) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${date.day}/${date.month}/${date.year}';
  }
}
