import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/feed_post.dart';

final feedProvider = StateNotifierProvider<FeedNotifier, AsyncValue<List<FeedPost>>>((ref) {
  final dio = ref.watch(apiClientProvider);
  return FeedNotifier(dio);
});

class FeedNotifier extends StateNotifier<AsyncValue<List<FeedPost>>> {
  final Dio _dio;
  int _page = 1;
  bool _hasMore = true;
  static const int _limit = 20;

  FeedNotifier(this._dio) : super(const AsyncValue.loading()) {
    fetchFeed();
  }

  bool get hasMore => _hasMore;

  Future<void> fetchFeed({bool refresh = false}) async {
    if (refresh) {
      _page = 1;
      _hasMore = true;
    }

    state = const AsyncValue.loading();
    try {
      final response = await _dio.get('/api/v1/feed', queryParameters: {
        'page': _page,
        'limit': _limit,
      });
      final data = response.data as Map<String, dynamic>;
      final list = (data['posts'] as List<dynamic>)
          .map((e) => FeedPost.fromJson(e as Map<String, dynamic>))
          .toList();

      _hasMore = list.length >= _limit;
      state = AsyncValue.data(list);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> loadMore() async {
    if (!_hasMore) return;
    final currentPosts = state.valueOrNull ?? [];
    _page++;

    try {
      final response = await _dio.get('/api/v1/feed', queryParameters: {
        'page': _page,
        'limit': _limit,
      });
      final data = response.data as Map<String, dynamic>;
      final newPosts = (data['posts'] as List<dynamic>)
          .map((e) => FeedPost.fromJson(e as Map<String, dynamic>))
          .toList();

      _hasMore = newPosts.length >= _limit;
      state = AsyncValue.data([...currentPosts, ...newPosts]);
    } catch (e) {
      _page--;
    }
  }

  Future<Map<String, dynamic>?> toggleLike(String postId) async {
    try {
      final response = await _dio.post('/api/v1/feed/$postId/like');
      final result = response.data as Map<String, dynamic>;

      final currentPosts = state.valueOrNull ?? [];
      final updated = currentPosts.map((post) {
        if (post.id == postId) {
          return FeedPost(
            id: post.id,
            content: post.content,
            imageUrl: post.imageUrl,
            createdAt: post.createdAt,
            user: post.user,
            likeCount: (result['likeCount'] as num?)?.toInt() ?? post.likeCount,
            commentCount: post.commentCount,
            hasLiked: result['liked'] as bool? ?? !post.hasLiked,
          );
        }
        return post;
      }).toList();
      state = AsyncValue.data(updated);

      return result;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> createPost(String content, {String? imageUrl}) async {
    try {
      final body = <String, dynamic>{'content': content};
      if (imageUrl != null) body['imageUrl'] = imageUrl;

      final response = await _dio.post('/api/v1/feed', data: body);
      await fetchFeed(refresh: true);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }
}
