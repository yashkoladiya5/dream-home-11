import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/poll_models.dart';
import '../../data/repositories/polls_repository.dart';

final pollsRepositoryProvider = Provider<PollsRepository>((ref) {
  final dio = ref.watch(apiClientProvider);
  return PollsRepository(dio);
});

final activePollProvider = FutureProvider<ActivePollResponse?>((ref) async {
  final repo = ref.watch(pollsRepositoryProvider);
  return repo.getActivePoll();
});

class PollVoteNotifier extends StateNotifier<AsyncValue<PollVoteResponse?>> {
  final PollsRepository _repo;

  PollVoteNotifier(this._repo) : super(const AsyncValue.data(null));

  Future<void> vote({
    required String pollId,
    required int selectedOption,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _repo.vote(
          pollId: pollId,
          selectedOption: selectedOption,
        ));
  }
}

final pollVoteProvider = StateNotifierProvider<PollVoteNotifier, AsyncValue<PollVoteResponse?>>((ref) {
  final repo = ref.watch(pollsRepositoryProvider);
  return PollVoteNotifier(repo);
});

final pollResultsProvider = FutureProvider.family<PollResults, String>((ref, pollId) async {
  final repo = ref.watch(pollsRepositoryProvider);
  return repo.getResults(pollId);
});
