import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/spin_models.dart';
import '../../data/repositories/gamification_repository.dart';

final gamificationRepositoryProvider = Provider<GamificationRepository>((ref) {
  final dio = ref.watch(apiClientProvider);
  return GamificationRepository(dio);
});

final spinStatusProvider = FutureProvider<SpinStatus>((ref) async {
  final repo = ref.watch(gamificationRepositoryProvider);
  return repo.getSpinStatus();
});

class SpinNotifier extends StateNotifier<AsyncValue<SpinResult?>> {
  final GamificationRepository _repo;

  SpinNotifier(this._repo) : super(const AsyncValue.data(null));

  Future<void> spin() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _repo.spin());
  }
}

final spinProvider = StateNotifierProvider<SpinNotifier, AsyncValue<SpinResult?>>((ref) {
  final repo = ref.watch(gamificationRepositoryProvider);
  return SpinNotifier(repo);
});
