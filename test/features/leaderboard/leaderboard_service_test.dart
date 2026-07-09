import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';
import 'package:dream_home_11/features/leaderboard/data/models/leaderboard_models.dart';
import 'package:dream_home_11/features/leaderboard/data/repositories/leaderboard_repository.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;
  late LeaderboardRepository repository;

  setUp(() {
    mockDio = MockDio();
    repository = LeaderboardRepository(mockDio);
  });

  group('LeaderboardEntry', () {
    test('fromJson parses entry correctly', () {
      final json = <String, dynamic>{
        'userId': 'user_1',
        'score': 2500.0,
        'rank': 1,
        'fullName': 'John Doe',
        'avatarUrl': 'https://example.com/avatar.jpg',
        'currentTier': 'gold',
      };
      final entry = LeaderboardEntry.fromJson(json);
      expect(entry.userId, 'user_1');
      expect(entry.score, 2500.0);
      expect(entry.rank, 1);
      expect(entry.initials, 'JD');
    });

    test('initials handles single name', () {
      final entry = LeaderboardEntry(
        userId: 'user_1',
        score: 100,
        rank: 5,
        fullName: 'Prince',
      );
      expect(entry.initials, 'P');
    });

    test('initials falls back to userId when no name', () {
      final entry = LeaderboardEntry(
        userId: 'user_1',
        score: 100,
        rank: 5,
      );
      expect(entry.initials, 'US');
    });

    test('tierLabel defaults to bronze', () {
      final entry = LeaderboardEntry(
        userId: 'user_1',
        score: 100,
        rank: 5,
      );
      expect(entry.tierLabel, 'bronze');
    });
  });

  group('LeaderboardRepository', () {
    test('getGlobalLeaderboard makes correct API call', () async {
      when(() => mockDio.get(
            '/api/v1/leaderboard',
            queryParameters: any(named: 'queryParameters'),
          )).thenAnswer((_) async => Response(
            requestOptions: RequestOptions(path: ''),
            statusCode: 200,
            data: <String, dynamic>{
              'entries': <Map<String, dynamic>>[
                <String, dynamic>{'userId': 'u1', 'score': 100, 'rank': 1},
              ],
              'totalCount': 1,
            },
          ));

      final result = await repository.getGlobalLeaderboard();
      expect(result.entries.length, 1);
      expect(result.totalCount, 1);
    });

    test('getSeriesLeaderboard includes contestId', () async {
      when(() => mockDio.get(
            '/api/v1/leaderboard/series/contest_1',
            queryParameters: any(named: 'queryParameters'),
          )).thenAnswer((_) async => Response(
            requestOptions: RequestOptions(path: ''),
            statusCode: 200,
            data: <String, dynamic>{
              'entries': <Map<String, dynamic>>[],
              'totalCount': 0,
              'contestId': 'contest_1',
            },
          ));

      final result = await repository.getSeriesLeaderboard(contestId: 'contest_1');
      expect(result.contestId, 'contest_1');
    });
  });
}
