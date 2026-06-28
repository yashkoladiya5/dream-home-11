import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/chat_history_provider.dart';
import '../providers/chat_provider.dart';
import '../../data/models/chat_list_models.dart';

class ChatListScreen extends ConsumerWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatListAsync = ref.watch(chatListProvider);

    ref.listen(newMessageProvider, (prev, next) {
      next.whenData((_) {
        ref.invalidate(chatListProvider);
      });
    });

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Chats', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white)),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: chatListAsync.when(
        data: (response) {
          final chats = response.data;
          if (chats.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.chat_bubble_outline_rounded, color: AppTheme.greyMedium.withValues(alpha: 0.4), size: 64),
                  const SizedBox(height: 16),
                  Text('No conversations yet',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.greyMedium)),
                  const SizedBox(height: 8),
                  Text('Join a contest to start chatting',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyDark)),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(chatListProvider.future),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              itemCount: chats.length,
              itemBuilder: (context, index) {
                final chat = chats[index];
                return _ChatListTile(chat: chat);
              },
            ),
          );
        },
        loading: () => const _ChatListShimmer(),
        error: (e, s) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline_rounded, color: AppTheme.primaryRed.withValues(alpha: 0.6), size: 48),
              const SizedBox(height: 12),
              Text('Something went wrong', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppTheme.greyMedium)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.refresh(chatListProvider.future),
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.goldYellow, foregroundColor: Colors.black),
                child: const Text('RETRY'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChatListTile extends ConsumerWidget {
  final ChatListItem chat;

  const _ChatListTile({required this.chat});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final otherUser = chat.participants.isNotEmpty
        ? chat.participants.first
        : null;
    final displayName = chat.name ?? otherUser?.fullName ?? 'Unknown';
    final initials = displayName.isNotEmpty ? displayName[0].toUpperCase() : '?';

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: () => context.push('/chat/${chat.id}'),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: AppTheme.darkCardGradient,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0x1FFFFFFF)),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: AppTheme.goldYellow.withValues(alpha: 0.2),
                child: Text(
                  initials,
                  style: const TextStyle(
                    color: AppTheme.goldYellow,
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            displayName,
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (chat.lastMessage != null)
                          Text(
                            _formatTime(chat.lastMessage!.createdAt),
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppTheme.greyMedium,
                              fontSize: 11,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            chat.lastMessage?.content ?? 'No messages yet',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: chat.lastMessage != null ? AppTheme.greyLight : AppTheme.greyDark,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (chat.unreadCount > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryRed,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '${chat.unreadCount}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inHours < 1) return '${diff.inMinutes}m';
    if (diff.inDays < 1) return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    if (diff.inDays == 1) return 'Yesterday';
    return '${dt.day}/${dt.month}';
  }
}

class _ChatListShimmer extends StatelessWidget {
  const _ChatListShimmer();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      itemCount: 6,
      itemBuilder: (context, i) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Container(
            padding: const EdgeInsets.all(12),
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
                    shape: BoxShape.circle,
                    color: AppTheme.greyDark.withValues(alpha: 0.5),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 140,
                        height: 14,
                        decoration: BoxDecoration(
                          color: AppTheme.greyDark.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: 200,
                        height: 12,
                        decoration: BoxDecoration(
                          color: AppTheme.greyDark.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
