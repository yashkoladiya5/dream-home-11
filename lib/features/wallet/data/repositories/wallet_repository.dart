import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class WalletRepository extends BaseRepository {
  WalletRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getWalletBalance();
  Future<Response<Map<String, dynamic>>> getTransactionHistory();
  Future<Response<Map<String, dynamic>>> deposit(Map data);
  Future<Response<Map<String, dynamic>>> withdraw(Map data);
}
