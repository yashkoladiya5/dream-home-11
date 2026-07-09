import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';
import 'package:dream_home_11/features/contests/data/models/contest_model.dart';

class MockDio extends Mock implements Dio {}

void main() {
  group('ContestModel', () {
    test('fromJson parses contest correctly', () {
      final json = {
        'id': 'contest_1',
        'title': 'Mega Contest',
        'type': 'mega',
        'entryFeeInr': '50',
        'pointsToJoin': '0',
        'maxSlots': '100',
        'filledSlots': '45',
        'prize': '₹10,000',
        'startTime': '2025-06-01T10:00:00.000Z',
        'endTime': '2025-06-10T10:00:00.000Z',
        'status': 'upcoming',
      };
      final contest = ContestModel.fromJson(json);
      expect(contest.title, 'Mega Contest');
      expect(contest.entryFeeInr, 50.0);
      expect(contest.spotsLeft, 55);
      expect(contest.fillPercentage, 0.45);
    });

    test('fromJson handles integer values in string fields', () {
      final json = {
        'id': 'contest_2',
        'title': 'Daily Contest',
        'type': 'normal',
        'entryFeeInr': 25,
        'pointsToJoin': 0,
        'maxSlots': 50,
        'filledSlots': 50,
        'startTime': '2025-06-01T10:00:00.000Z',
        'endTime': '2025-06-10T10:00:00.000Z',
        'status': 'live',
      };
      final contest = ContestModel.fromJson(json);
      expect(contest.entryFeeInr, 25.0);
      expect(contest.spotsLeft, 0);
      expect(contest.fillPercentage, 1.0);
    });

    test('fromJson handles missing optional fields', () {
      final json = {
        'id': 'contest_3',
        'title': 'Free Contest',
        'type': 'normal',
        'entryFeeInr': '0',
        'pointsToJoin': '0',
        'maxSlots': '10',
        'filledSlots': '2',
        'startTime': '2025-06-01T10:00:00.000Z',
        'endTime': '2025-06-10T10:00:00.000Z',
        'status': 'upcoming',
      };
      final contest = ContestModel.fromJson(json);
      expect(contest.prize, isNull);
      expect(contest.badgeText, isNull);
      expect(contest.canJoin, isNull);
    });

    test('spotsLeft and fillPercentage compute correctly', () {
      final json = {
        'id': 'contest_4',
        'title': 'Full Contest',
        'type': 'normal',
        'entryFeeInr': '100',
        'pointsToJoin': '0',
        'maxSlots': '20',
        'filledSlots': '20',
        'startTime': '2025-06-01T10:00:00.000Z',
        'endTime': '2025-06-10T10:00:00.000Z',
        'status': 'live',
      };
      final contest = ContestModel.fromJson(json);
      expect(contest.spotsLeft, 0);
      expect(contest.fillPercentage, 1.0);
    });

    test('fromJson uses default type normal when missing', () {
      final json = {
        'id': 'contest_5',
        'title': 'Test',
        'entryFeeInr': '0',
        'pointsToJoin': '0',
        'maxSlots': '10',
        'filledSlots': '0',
        'startTime': '2025-06-01T10:00:00.000Z',
        'endTime': '2025-06-10T10:00:00.000Z',
        'status': 'upcoming',
      };
      final contest = ContestModel.fromJson(json);
      expect(contest.type, 'normal');
    });
  });
}
