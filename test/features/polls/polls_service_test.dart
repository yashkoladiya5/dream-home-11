import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';
import 'package:dream_home_11/features/polls/data/models/poll_models.dart';
import 'package:dream_home_11/features/polls/data/repositories/polls_repository.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;
  late PollsRepository repository;

  setUp(() {
    mockDio = MockDio();
    repository = PollsRepository(mockDio);
  });

  group('Poll models', () {
    test('Poll.fromJson parses correctly', () {
      final json = <String, dynamic>{
        'id': 'poll_1',
        'question': 'Who will win?',
        'options': <String>['Team A', 'Team B'],
        'totalVotes': 100,
        'activeFrom': '2025-06-01T10:00:00.000Z',
        'activeTo': '2025-06-10T10:00:00.000Z',
        'isActive': true,
      };
      final poll = Poll.fromJson(json);
      expect(poll.question, 'Who will win?');
      expect(poll.options.length, 2);
      expect(poll.isActive, true);
    });

    test('PollOption.fromJson parses correctly', () {
      final json = <String, dynamic>{'option': 'Team A', 'count': 60, 'percentage': 60};
      final option = PollOption.fromJson(json);
      expect(option.option, 'Team A');
      expect(option.count, 60);
      expect(option.percentage, 60);
    });

    test('PollVoteResponse.fromJson parses vote result', () {
      final json = <String, dynamic>{
        'success': true,
        'message': 'Vote recorded',
        'pointsAwarded': 10,
        'results': <Map<String, dynamic>>[
          <String, dynamic>{'option': 'Team A', 'count': 60, 'percentage': 60},
          <String, dynamic>{'option': 'Team B', 'count': 40, 'percentage': 40},
        ],
        'totalVotes': 100,
      };
      final resp = PollVoteResponse.fromJson(json);
      expect(resp.success, true);
      expect(resp.pointsAwarded, 10);
      expect(resp.results.length, 2);
    });
  });

  group('PollsRepository', () {
    test('getActivePoll returns null when no poll', () async {
      when(() => mockDio.get('/api/v1/polls/active'))
          .thenAnswer((_) async => Response(
            requestOptions: RequestOptions(path: ''),
            statusCode: 200,
            data: <String, dynamic>{},
          ));

      final result = await repository.getActivePoll();
      expect(result, isNull);
    });

    test('getActivePoll returns poll when available', () async {
      when(() => mockDio.get('/api/v1/polls/active'))
          .thenAnswer((_) async => Response(
            requestOptions: RequestOptions(path: ''),
            statusCode: 200,
            data: <String, dynamic>{
              'poll': <String, dynamic>{
                'id': 'poll_1',
                'question': 'Test?',
                'options': <String>['A', 'B'],
                'totalVotes': 0,
                'activeFrom': '2025-06-01T10:00:00.000Z',
                'activeTo': '2025-06-10T10:00:00.000Z',
                'isActive': true,
              },
            },
          ));

      final result = await repository.getActivePoll();
      expect(result, isNotNull);
      expect(result!.poll.question, 'Test?');
    });

    test('vote makes POST request', () async {
      when(() => mockDio.post(
            '/api/v1/polls/vote',
            data: any(named: 'data'),
          )).thenAnswer((_) async => Response(
            requestOptions: RequestOptions(path: ''),
            statusCode: 200,
            data: <String, dynamic>{
              'success': true,
              'message': 'Vote recorded',
              'pointsAwarded': 10,
              'results': <Map<String, dynamic>>[],
              'totalVotes': 0,
            },
          ));

      final result = await repository.vote(pollId: 'poll_1', selectedOption: 0);
      expect(result.success, true);
    });
  });
}
