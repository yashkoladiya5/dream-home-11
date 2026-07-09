import 'package:flutter_test/flutter_test.dart';
import 'package:dream_home_11/features/notifications/data/models/notification_log.dart';

void main() {
  group('NotificationLog', () {
    test('fromJson parses notification correctly', () {
      final json = {
        'id': 'notif_1',
        'userId': 'user_1',
        'title': 'New Contest',
        'body': 'A new contest is available!',
        'type': 'contest',
        'isRead': false,
        'createdAt': '2025-06-01T10:00:00.000Z',
      };
      final notif = NotificationLog.fromJson(json);
      expect(notif.id, 'notif_1');
      expect(notif.title, 'New Contest');
      expect(notif.isRead, false);
      expect(notif.type, 'contest');
    });

    test('fromJson defaults type to general', () {
      final json = {
        'id': 'notif_2',
        'userId': 'user_1',
        'title': 'Welcome',
        'body': 'Welcome to Dream11!',
        'isRead': true,
        'createdAt': '2025-06-01T10:00:00.000Z',
      };
      final notif = NotificationLog.fromJson(json);
      expect(notif.type, 'general');
      expect(notif.isRead, true);
    });

    test('fromJson handles read notification', () {
      final json = {
        'id': 'notif_3',
        'userId': 'user_1',
        'title': 'Points Earned',
        'body': 'You earned 50 points!',
        'type': 'points',
        'isRead': true,
        'createdAt': '2025-06-02T10:00:00.000Z',
      };
      final notif = NotificationLog.fromJson(json);
      expect(notif.isRead, true);
    });

    test('factory constructor works', () {
      final notif = NotificationLog(
        id: 'notif_4',
        userId: 'user_1',
        title: 'Test',
        body: 'Body',
        type: 'general',
        isRead: false,
        createdAt: DateTime(2025, 6, 1),
      );
      expect(notif.id, 'notif_4');
    });
  });
}
