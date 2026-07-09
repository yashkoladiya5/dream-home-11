import 'package:flutter_test/flutter_test.dart';
import 'package:dream_home_11/features/points/data/models/daily_action.dart';
import 'package:dream_home_11/features/points/data/models/streak_info.dart';
import 'package:dream_home_11/features/points/data/models/multiplier_info.dart';

void main() {
  group('DailyAction', () {
    test('fromJson parses action correctly', () {
      final json = {
        'action': 'login',
        'name': 'Daily Login',
        'description': 'Log in to the app',
        'basePoints': 10,
        'dailyCap': 1,
        'todayCount': 0,
        'canPerform': true,
      };
      final action = DailyAction.fromJson(json);
      expect(action.name, 'Daily Login');
      expect(action.remaining, 1);
      expect(action.isComplete, false);
    });

    test('fromJson handles reached daily cap', () {
      final json = {
        'action': 'login',
        'name': 'Daily Login',
        'description': 'Log in to the app',
        'basePoints': 10,
        'dailyCap': 1,
        'todayCount': 1,
        'canPerform': false,
        'reason': 'Daily cap reached',
      };
      final action = DailyAction.fromJson(json);
      expect(action.isComplete, true);
      expect(action.remaining, 0);
      expect(action.reason, 'Daily cap reached');
    });

    test('progress returns correct ratio', () {
      final action = DailyAction(
        action: 'test',
        name: 'Test',
        description: '',
        basePoints: 10,
        dailyCap: 5,
        todayCount: 2,
        canPerform: true,
      );
      expect(action.progress, 0.4);
    });
  });

  group('StreakInfo', () {
    test('fromJson parses streak data', () {
      final json = {
        'currentStreak': 5,
        'longestStreak': 10,
        'lastStreakDate': '2025-06-01',
        'nextMilestone': 7,
        'daysToNextMilestone': 2,
        'nextMilestoneReward': 50,
      };
      final streak = StreakInfo.fromJson(json);
      expect(streak.currentStreak, 5);
      expect(streak.isOnStreak, true);
      expect(streak.progress, closeTo(5 / 7, 0.001));
    });

    test('fromJson handles zero streak', () {
      final json = <String, dynamic>{};
      final streak = StreakInfo.fromJson(json);
      expect(streak.currentStreak, 0);
      expect(streak.isOnStreak, false);
    });

    test('progress returns 0 when no milestone', () {
      final streak = StreakInfo(
        currentStreak: 3,
        longestStreak: 5,
      );
      expect(streak.progress, 0.0);
    });
  });

  group('MultiplierInfo', () {
    test('fromJson parses multiplier data', () {
      final json = {
        'currentTier': 'silver',
        'currentMultiplier': 1.5,
        'lifetimePoints': 500,
        'pointsToNextTier': 500,
        'nextTier': 'gold',
        'nextMultiplier': 2.0,
      };
      final info = MultiplierInfo.fromJson(json);
      expect(info.currentTier, 'silver');
      expect(info.currentMultiplier, 1.5);
      expect(info.isMaxTier, false);
    });

    test('fromJson handles max tier', () {
      final json = {
        'currentTier': 'diamond',
        'currentMultiplier': 5.0,
        'lifetimePoints': 10000,
      };
      final info = MultiplierInfo.fromJson(json);
      expect(info.isMaxTier, true);
      expect(info.progressToNextTier, 1.0);
    });

    test('progressToNextTier computes correctly', () {
      final info = MultiplierInfo(
        currentTier: 'bronze',
        currentMultiplier: 1.0,
        lifetimePoints: 200,
        pointsToNextTier: 300,
        nextTier: 'silver',
        nextMultiplier: 1.5,
      );
      expect(info.progressToNextTier, 0.4);
    });
  });
}
