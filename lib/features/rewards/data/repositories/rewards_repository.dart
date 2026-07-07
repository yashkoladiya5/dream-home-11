import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class RewardsRepository extends BaseRepository {
  RewardsRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getRewards();
  Future<Response<Map<String, dynamic>>> getRedemptions();
  Future<Response<Map<String, dynamic>>> redeemReward(String rewardId);
}
