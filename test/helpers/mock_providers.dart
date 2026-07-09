import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dream_home_11/core/network/api_client.dart';

class MockDio extends Mock implements Dio {}

/// Overrides the apiClientProvider with a mock Dio instance.
ProviderOverride overrideDioWithMock(MockDio mockDio) {
  return apiClientProvider.overrideWith((ref) => mockDio);
}
