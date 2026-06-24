import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/share_provider.dart';
import '../../data/models/share_event.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';

class ShareTrackerScreen extends ConsumerStatefulWidget {
  const ShareTrackerScreen({super.key});

  @override
  ConsumerState<ShareTrackerScreen> createState() => _ShareTrackerScreenState();
}

class _ShareTrackerScreenState extends ConsumerState<ShareTrackerScreen> {
  // ignore: unused_field
  String? _sharingChannel;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(shareHistoryProvider.notifier).fetchHistory());
  }

  Future<void> _share(String channel) async {
    setState(() => _sharingChannel = channel);

    final history = ref.read(shareHistoryProvider);
    final inviteCode = history.whenOrNull(data: (shares) => shares.isNotEmpty ? shares.first.inviteCode : null) ?? 'DREAM11';
    final shareText = 'Join me on Dream Home 11! 🏏\n\nUse my invite code: $inviteCode\n\nDownload now and start winning!';

    try {
      switch (channel) {
        case 'copy_link':
          await Clipboard.setData(ClipboardData(text: inviteCode));
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Invite code copied!'), backgroundColor: AppTheme.emeraldGreen, behavior: SnackBarBehavior.floating),
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
        default:
          await Share.share(shareText, subject: 'Dream Home 11');
      }

      await ref.read(shareHistoryProvider.notifier).logShare(shareChannel: channel);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Shared successfully! +5 points'), backgroundColor: AppTheme.emeraldGreen, behavior: SnackBarBehavior.floating),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to share'), backgroundColor: AppTheme.primaryRed, behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _sharingChannel = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final historyState = ref.watch(shareHistoryProvider);
    final statsAsync = ref.watch(shareStatsProvider(null));

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Share & Earn'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: historyState.when(
        data: (history) => RefreshIndicator(
          onRefresh: () => ref.read(shareHistoryProvider.notifier).fetchHistory(),
          color: AppTheme.primaryRed,
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              children: [
                _buildStatsHero(statsAsync),
                const SizedBox(height: 24),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildSectionTitle('Share Now'),
                      const SizedBox(height: 16),
                      _buildShareChannels(),
                      const SizedBox(height: 28),
                      _buildSectionTitle('Share History'),
                      const SizedBox(height: 16),
                      if (history.isEmpty)
                        _buildEmptyHistory()
                      else
                        ...history.map((event) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _buildHistoryCard(event),
                        )),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
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
                  'Failed to load share history',
                  style: Theme.of(context).textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => ref.read(shareHistoryProvider.notifier).fetchHistory(),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatsHero(AsyncValue<Map<String, dynamic>> statsAsync) {
    final theme = Theme.of(context);
    final totalShares = statsAsync.valueOrNull?['totalShares'] as int? ?? 0;
    final totalPoints = statsAsync.valueOrNull?['totalPointsEarned'] as int? ?? 0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        border: const Border(
          bottom: BorderSide(color: Color(0x1FFFFFFF)),
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 8),
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppTheme.primaryGradient,
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryRed.withValues(alpha: 0.3),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Icon(Icons.share_rounded, color: Colors.white, size: 30),
          ),
          const SizedBox(height: 16),
          Text(
            'Sharing Stats',
            style: theme.textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Column(
                children: [
                  Text(
                    '$totalShares',
                    style: theme.textTheme.displayLarge?.copyWith(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryRed,
                      height: 1,
                    ),
                  ),
                  Text(
                    'Shares',
                    style: theme.textTheme.bodyMedium?.copyWith(fontSize: 12, color: AppTheme.greyMedium),
                  ),
                ],
              ),
              Container(
                height: 40,
                width: 1,
                margin: const EdgeInsets.symmetric(horizontal: 32),
                color: Colors.white.withValues(alpha: 0.1),
              ),
              Column(
                children: [
                  Text(
                    '$totalPoints',
                    style: theme.textTheme.displayLarge?.copyWith(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.goldYellow,
                      height: 1,
                    ),
                  ),
                  Text(
                    'Points',
                    style: theme.textTheme.bodyMedium?.copyWith(fontSize: 12, color: AppTheme.greyMedium),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Container(
          width: 4,
          height: 18,
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildShareChannels() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildChannelButton(Icons.chat_rounded, 'WhatsApp', 'whatsapp'),
        _buildChannelButton(Icons.send_rounded, 'Telegram', 'telegram'),
        _buildChannelButton(Icons.sms_rounded, 'SMS', 'sms'),
        _buildChannelButton(Icons.link_rounded, 'Copy Link', 'copy_link'),
      ],
    );
  }

  Widget _buildChannelButton(IconData icon, String label, String channel) {
    final isLoading = _sharingChannel == channel;
    return InkWell(
      onTap: isLoading ? null : () => _share(channel),
      borderRadius: BorderRadius.circular(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 60,
            height: 60,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    gradient: AppTheme.darkCardGradient,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: isLoading ? 0.05 : 0.1)),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryRed.withValues(alpha: isLoading ? 0.05 : 0.15),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(icon, color: isLoading ? AppTheme.greyMedium : AppTheme.primaryRed, size: 26),
                ),
                if (isLoading)
                  const SizedBox(
                    width: 30,
                    height: 30,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: AppTheme.primaryRed),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontSize: 11,
              color: AppTheme.greyMedium,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryCard(ShareEvent event) {
    final theme = Theme.of(context);
    return Container(
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
              child: Icon(
                _channelIcon(event.shareChannel),
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
                    event.channelLabel,
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _formattedDate(event.sharedAt),
                    style: theme.textTheme.bodyMedium?.copyWith(fontSize: 12, color: AppTheme.greyMedium),
                  ),
                ],
              ),
            ),
            if (event.pointsAwarded > 0)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.stars_rounded, color: AppTheme.goldYellow, size: 14),
                  const SizedBox(width: 4),
                  Text(
                    '+${event.pointsAwarded}',
                    style: theme.textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.goldYellow,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyHistory() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32),
      decoration: BoxDecoration(
        gradient: AppTheme.darkCardGradient,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x1FFFFFFF)),
      ),
      child: Column(
        children: [
          Icon(Icons.share_rounded, size: 40, color: AppTheme.greyMedium.withValues(alpha: 0.5)),
          const SizedBox(height: 12),
          Text(
            'No shares yet',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppTheme.greyMedium),
          ),
          const SizedBox(height: 4),
          Text(
            'Share contests with friends to earn bonus points',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 12, color: AppTheme.greyMedium),
          ),
        ],
      ),
    );
  }

  Widget _buildShimmer() {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Column(
        children: [
          const SizedBox(height: 200),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                const ShimmerCard(height: 80, borderRadius: 16),
                const SizedBox(height: 12),
                const ShimmerCard(height: 80, borderRadius: 16),
                const SizedBox(height: 12),
                const ShimmerCard(height: 80, borderRadius: 16),
                const SizedBox(height: 12),
                const ShimmerCard(height: 80, borderRadius: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }

  IconData _channelIcon(String channel) {
    switch (channel) {
      case 'whatsapp': return Icons.chat_rounded;
      case 'telegram': return Icons.send_rounded;
      case 'sms': return Icons.sms_rounded;
      case 'copy_link': return Icons.link_rounded;
      default: return Icons.share_rounded;
    }
  }

  String _formattedDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${date.day}/${date.month}/${date.year}';
  }
}
