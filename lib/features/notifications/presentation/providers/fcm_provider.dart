import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../services/fcm_service.dart';

final fcmServiceProvider = Provider<FcmService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return FcmService(dio);
});

final fcmTokenProvider = FutureProvider<String?>((ref) async {
  final service = ref.watch(fcmServiceProvider);
  return service.getToken();
});
