import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class HelpRepository extends BaseRepository {
  HelpRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getFAQs();
  Future<Response<Map<String, dynamic>>> submitTicket(Map data);
}
