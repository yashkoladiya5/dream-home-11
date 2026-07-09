import 'package:flutter_test/flutter_test.dart';
import 'package:dream_home_11/features/rewards/data/models/reward.dart';
import 'package:dream_home_11/features/rewards/data/models/reward_redemption.dart';

void main() {
  group('Reward', () {
    test('fromJson parses reward correctly', () {
      final json = {
        'id': 'reward_1',
        'title': 'Gift Card',
        'description': 'Amazon Gift Card',
        'imageUrl': 'https://example.com/gift.jpg',
        'pointsRequired': 500,
        'stock': 10,
        'category': 'gift_card',
        'isActive': true,
        'sortOrder': 1,
        'createdAt': '2025-06-01T10:00:00.000Z',
      };
      final reward = Reward.fromJson(json);
      expect(reward.title, 'Gift Card');
      expect(reward.pointsRequired, 500);
      expect(reward.isOutOfStock, false);
    });

    test('isOutOfStock returns true when stock is 0', () {
      final json = {
        'id': 'reward_2',
        'title': 'Out of Stock',
        'pointsRequired': 100,
        'stock': 0,
        'category': 'gift_card',
        'isActive': true,
        'sortOrder': 2,
        'createdAt': '2025-06-01T10:00:00.000Z',
      };
      final reward = Reward.fromJson(json);
      expect(reward.isOutOfStock, true);
    });

    test('isOutOfStock returns false when stock is null', () {
      final json = {
        'id': 'reward_3',
        'title': 'Unlimited',
        'pointsRequired': 200,
        'category': 'gift_card',
        'isActive': true,
        'sortOrder': 3,
        'createdAt': '2025-06-01T10:00:00.000Z',
      };
      final reward = Reward.fromJson(json);
      expect(reward.isOutOfStock, false);
    });

    test('category defaults to gift_card', () {
      final json = {
        'id': 'reward_4',
        'title': 'Test',
        'pointsRequired': 0,
        'isActive': true,
        'sortOrder': 0,
        'createdAt': '2025-06-01T10:00:00.000Z',
      };
      final reward = Reward.fromJson(json);
      expect(reward.category, 'gift_card');
    });
  });

  group('RewardRedemption', () {
    test('fromJson parses redemption correctly', () {
      final json = {
        'id': 'redemption_1',
        'rewardId': 'reward_1',
        'pointsSpent': 500,
        'status': 'pending',
        'redeemedAt': '2025-06-15T10:00:00.000Z',
        'reward': {
          'title': 'Gift Card',
          'imageUrl': 'https://example.com/gift.jpg',
          'pointsRequired': 500,
        },
      };
      final redemption = RewardRedemption.fromJson(json);
      expect(redemption.pointsSpent, 500);
      expect(redemption.rewardTitle, 'Gift Card');
    });

    test('fromJson handles no reward data', () {
      final json = {
        'id': 'redemption_2',
        'rewardId': 'reward_2',
        'pointsSpent': 300,
        'status': 'fulfilled',
        'redeemedAt': '2025-06-15T10:00:00.000Z',
        'fulfilledAt': '2025-06-20T10:00:00.000Z',
      };
      final redemption = RewardRedemption.fromJson(json);
      expect(redemption.status, 'fulfilled');
      expect(redemption.rewardTitle, isNull);
    });
  });
}
