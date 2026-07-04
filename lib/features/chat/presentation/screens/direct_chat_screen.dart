import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../providers/chat_history_provider.dart';
import '../providers/chat_provider.dart';
import '../../data/models/chat_message.dart';
import '../../../dashboard/presentation/providers/user_profile_provider.dart';

class DirectChatScreen extends ConsumerStatefulWidget {
  final String chatId;

  const DirectChatScreen({super.key, required this.chatId});

  @override
  ConsumerState<DirectChatScreen> createState() => _DirectChatScreenState();
}

class _DirectChatScreenState extends ConsumerState<DirectChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isLoading = true;
  bool _hasMore = true;
  int _page = 1;
  bool _isLoadingMore = false;
  String? _myUserId;

  @override
  void initState() {
    super.initState();
    _loadUserId();
    _loadMessages();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chatActionsProvider).joinChat(widget.chatId);
    });
  }

  void _loadUserId() {
    try {
      final profileState = ref.read(userProfileProvider);
      _myUserId = profileState.valueOrNull?.id;
    } catch (_) {
      _myUserId = null;
    }
  }

  Future<void> _loadMessages() async {
    try {
      final response = await ref
          .read(chatHistoryRepositoryProvider)
          .getMessages(widget.chatId, page: _page);
      if (!mounted) return;
      final sorted = List<ChatMessage>.from(response.data)
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      setState(() {
        if (_page == 1) {
          _messages.clear();
          _messages.addAll(sorted);
        } else {
          _messages.addAll(sorted);
        }
        _hasMore = response.meta.hasMore;
        _isLoading = false;
        _isLoadingMore = false;
      });
      if (_page == 1 && _messages.isNotEmpty) {
        _scrollToBottom();
        ref.read(chatActionsProvider).markRead(
              chatId: widget.chatId,
              messageId: _messages.first.id,
            );
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels <= 50 &&
        _hasMore &&
        !_isLoadingMore) {
      setState(() => _isLoadingMore = true);
      _page++;
      _loadMessages();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    ref.read(chatActionsProvider).sendMessage(
          chatId: widget.chatId,
          content: text,
        );
    _messageController.clear();
    _scrollToBottom();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    ref.read(chatActionsProvider).leaveChat(widget.chatId);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(newMessageProvider, (prev, next) {
      next.whenData((msg) {
        if (msg.chatId == widget.chatId) {
          setState(() => _messages.insert(0, msg));
          _scrollToBottom();
        }
      });
    });

    ref.listen(readReceiptProvider, (prev, next) {
      next.whenData((data) {
        final messageId = data['messageId'] as String?;
        final chatId = data['chatId'] as String?;
        if (messageId != null && chatId == widget.chatId) {
          setState(() {
            final idx = _messages.indexWhere((m) => m.id == messageId);
            if (idx != -1) {
              final old = _messages[idx];
              _messages[idx] = ChatMessage(
                id: old.id,
                chatId: old.chatId,
                senderId: old.senderId,
                senderName: old.senderName,
                senderAvatarUrl: old.senderAvatarUrl,
                content: old.content,
                type: old.type,
                createdAt: old.createdAt,
                isRead: true,
              );
            }
          });
        }
      });
    });

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Chat',
          style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white),
        ),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: Column(
        children: [
          Expanded(child: _buildMessageList()),
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildMessageList() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.goldYellow),
      );
    }

    if (_messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.chat_bubble_outline_rounded,
              color: AppTheme.greyMedium.withValues(alpha: 0.4),
              size: 64,
            ),
            const SizedBox(height: 16),
            Text(
              'No messages yet',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(color: AppTheme.greyMedium),
            ),
            const SizedBox(height: 8),
            Text(
              'Send a message to start the conversation',
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: AppTheme.greyDark),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      itemCount: _messages.length + (_isLoadingMore ? 1 : 0),
      reverse: true,
      addAutomaticKeepAlives: true,
      cacheExtent: 500,
      itemBuilder: (context, index) {
        if (index >= _messages.length) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppTheme.goldYellow,
                ),
              ),
            ),
          );
        }
        final msg = _messages[index];
        final isMe = _myUserId != null && msg.senderId == _myUserId;
        return _MessageBubble(message: msg, isMe: isMe);
      },
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: const BoxDecoration(
        color: AppTheme.secondarySlate,
        border: Border(top: BorderSide(color: Color(0x1FFFFFFF))),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Type a message...',
                hintStyle: const TextStyle(color: AppTheme.greyMedium),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: const BorderSide(color: Color(0x1FFFFFFF)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: const BorderSide(color: Color(0x1FFFFFFF)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: const BorderSide(color: AppTheme.goldYellow),
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                filled: true,
                fillColor: AppTheme.darkSlate,
              ),
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _sendMessage,
            child: Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: AppTheme.goldYellow,
                borderRadius: BorderRadius.all(Radius.circular(22)),
              ),
              child: const Icon(
                Icons.send_rounded,
                color: Colors.black,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;

  const _MessageBubble({required this.message, required this.isMe});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Column(
        crossAxisAlignment:
            isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.75,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isMe ? AppTheme.goldYellow.withValues(alpha: 0.2) : null,
              gradient: isMe ? null : AppTheme.darkCardGradient,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft:
                    isMe ? const Radius.circular(16) : Radius.zero,
                bottomRight:
                    isMe ? Radius.zero : const Radius.circular(16),
              ),
              border: isMe
                  ? null
                  : Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isMe && message.senderName != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      message.senderName!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.goldYellow,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ),
                Text(
                  message.content,
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: Colors.white),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _formatTime(message.createdAt),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppTheme.greyMedium,
                            fontSize: 10,
                          ),
                    ),
                    if (isMe) ...[
                      const SizedBox(width: 4),
                      Icon(
                        message.isRead
                            ? Icons.done_all_rounded
                            : Icons.done_rounded,
                        color: message.isRead
                            ? AppTheme.emeraldGreen
                            : AppTheme.greyMedium,
                        size: 14,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}
