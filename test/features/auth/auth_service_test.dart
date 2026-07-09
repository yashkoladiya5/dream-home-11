import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';

class MockDio extends Mock implements Dio {}

void main() {
  late MockDio mockDio;

  setUp(() {
    mockDio = MockDio();
  });

  group('Auth - Dio client', () {
    test('sendOtp calls POST with phone number', () async {
      when(() => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/send-otp',
            data: any(named: 'data'),
          )).thenAnswer((_) async => Response(
            requestOptions: RequestOptions(path: ''),
            statusCode: 200,
            data: <String, dynamic>{'success': true},
          ));

      final response = await mockDio.post<Map<String, dynamic>>(
        '/api/v1/auth/send-otp',
        data: {'phone': '+919999999999'},
      );
      expect(response.statusCode, 200);
      verify(() => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/send-otp',
            data: any(named: 'data'),
          )).called(1);
    });

    test('verifyOtp returns token on success', () async {
      when(() => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/verify-otp',
            data: any(named: 'data'),
          )).thenAnswer((_) async => Response(
            requestOptions: RequestOptions(path: ''),
            statusCode: 200,
            data: <String, dynamic>{'token': 'abc123', 'user': <String, dynamic>{'id': '1'}},
          ));

      final response = await mockDio.post<Map<String, dynamic>>(
        '/api/v1/auth/verify-otp',
        data: {'phone': '+919999999999', 'otp': '1234'},
      );
      expect(response.data!['token'], 'abc123');
    });

    test('sendOtp throws on network error', () async {
      when(() => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/send-otp',
            data: any(named: 'data'),
          )).thenThrow(DioException(
            requestOptions: RequestOptions(path: ''),
            type: DioExceptionType.connectionTimeout,
          ));

      expect(
        () => mockDio.post<Map<String, dynamic>>(
          '/api/v1/auth/send-otp',
          data: {'phone': '+919999999999'},
        ),
        throwsA(isA<DioException>()),
      );
    });

    test('getProfile returns user data', () async {
      when(() => mockDio.get<Map<String, dynamic>>(
            '/api/v1/auth/profile',
          )).thenAnswer((_) async => Response(
            requestOptions: RequestOptions(path: ''),
            statusCode: 200,
            data: <String, dynamic>{'id': '1', 'name': 'Test User'},
          ));

      final response = await mockDio.get<Map<String, dynamic>>('/api/v1/auth/profile');
      expect(response.data!['name'], 'Test User');
    });

    test('refreshToken calls POST with refresh token', () async {
      when(() => mockDio.post<Map<String, dynamic>>(
            '/api/v1/auth/refresh',
            data: any(named: 'data'),
          )).thenAnswer((_) async => Response(
            requestOptions: RequestOptions(path: ''),
            statusCode: 200,
            data: <String, dynamic>{'token': 'new_token'},
          ));

      final response = await mockDio.post<Map<String, dynamic>>(
        '/api/v1/auth/refresh',
        data: {'refreshToken': 'old_refresh'},
      );
      expect(response.data!['token'], 'new_token');
    });
  });
}
