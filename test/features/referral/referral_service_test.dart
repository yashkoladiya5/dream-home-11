import 'package:flutter_test/flutter_test.dart';
import 'package:dream_home_11/features/referral/data/models/referral_stats.dart';

void main() {
  group('ReferralStats', () {
    test('fromJson parses stats correctly', () {
      final json = {
        'referralCode': 'DREAM123',
        'totalReferred': 10,
        'totalRewardsEarned': 500,
        'totalKycCompleted': 7,
      };
      final stats = ReferralStats.fromJson(json);
      expect(stats.referralCode, 'DREAM123');
      expect(stats.totalReferred, 10);
      expect(stats.totalRewardsEarned, 500);
      expect(stats.totalKycCompleted, 7);
    });

    test('fromJson defaults to zero', () {
      final json = <String, dynamic>{};
      final stats = ReferralStats.fromJson(json);
      expect(stats.referralCode, '');
      expect(stats.totalReferred, 0);
    });
  });

  group('ReferralHistoryItem', () {
    test('fromJson parses history item', () {
      final json = {
        'refereeName': 'Jane Doe',
        'refereeAvatarUrl': 'https://example.com/avatar.jpg',
        'status': 'settled',
        'signupReward': 50,
        'kycReward': 100,
        'createdAt': '2025-05-01T10:00:00.000Z',
        'settledAt': '2025-05-15T10:00:00.000Z',
      };
      final item = ReferralHistoryItem.fromJson(json);
      expect(item.refereeName, 'Jane Doe');
      expect(item.status, 'settled');
      expect(item.signupReward, 50);
    });

    test('fromJson defaults to pending status', () {
      final json = {
        'signupReward': 0,
        'kycReward': 0,
        'createdAt': '2025-05-01T10:00:00.000Z',
      };
      final item = ReferralHistoryItem.fromJson(json);
      expect(item.status, 'pending');
    });
  });
}
