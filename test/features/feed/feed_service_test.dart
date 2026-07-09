import 'package:flutter_test/flutter_test.dart';
import 'package:dream_home_11/features/feed/data/models/feed_post.dart';

void main() {
  group('FeedUser', () {
    test('fromJson parses user correctly', () {
      final json = {
        'id': 'user_1',
        'fullName': 'John Doe',
        'avatarUrl': 'https://example.com/avatar.jpg',
        'currentTier': 'gold',
      };
      final user = FeedUser.fromJson(json);
      expect(user.fullName, 'John Doe');
      expect(user.currentTier, 'gold');
    });
  });

  group('FeedPost', () {
    test('fromJson parses post correctly', () {
      final json = {
        'id': 'post_1',
        'content': 'Great contest!',
        'imageUrl': 'https://example.com/img.jpg',
        'createdAt': '2025-06-01T10:00:00.000Z',
        'user': {
          'id': 'user_1',
          'fullName': 'John Doe',
        },
        'likeCount': 5,
        'commentCount': 2,
        'hasLiked': false,
      };
      final post = FeedPost.fromJson(json);
      expect(post.content, 'Great contest!');
      expect(post.likeCount, 5);
      expect(post.hasLiked, false);
      expect(post.user.fullName, 'John Doe');
    });

    test('fromJson handles liked post', () {
      final json = {
        'id': 'post_2',
        'content': 'Won my contest!',
        'createdAt': '2025-06-02T10:00:00.000Z',
        'user': {
          'id': 'user_2',
          'fullName': 'Jane Doe',
        },
        'likeCount': 15,
        'commentCount': 3,
        'hasLiked': true,
      };
      final post = FeedPost.fromJson(json);
      expect(post.hasLiked, true);
      expect(post.likeCount, 15);
    });

    test('fromJson defaults counts to zero', () {
      final json = {
        'id': 'post_3',
        'content': 'Hello world!',
        'createdAt': '2025-06-03T10:00:00.000Z',
        'user': {
          'id': 'user_3',
        },
      };
      final post = FeedPost.fromJson(json);
      expect(post.likeCount, 0);
      expect(post.commentCount, 0);
      expect(post.hasLiked, false);
    });
  });
}
