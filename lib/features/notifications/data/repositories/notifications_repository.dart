import '../../../../core/network/base_repository.dart';
import 'package:dio/dio.dart';

abstract class NotificationsRepository extends BaseRepository {
  NotificationsRepository(super.dio);

  Future<Response<Map<String, dynamic>>> getNotifications();
  Future<Response<Map<String, dynamic>>> markAsRead(String id);
}
