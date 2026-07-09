import 'package:flutter_test/flutter_test.dart';
import 'package:dream_home_11/features/chat/data/models/chat_message.dart';

void main() {
  group('ChatMessage', () {
    test('fromJson parses message correctly', () {
      final json = {
        'id': 'msg_1',
        'chatId': 'chat_1',
        'senderId': 'user_1',
        'sender': {
          'fullName': 'John Doe',
          'avatarUrl': 'https://example.com/avatar.jpg',
        },
        'content': 'Hello!',
        'type': 'text',
        'createdAt': '2025-06-01T10:00:00.000Z',
        'isRead': false,
      };
      final msg = ChatMessage.fromJson(json);
      expect(msg.content, 'Hello!');
      expect(msg.senderName, 'John Doe');
      expect(msg.isRead, false);
    });

    test('fromJson handles message with sender fields directly', () {
      final json = {
        'id': 'msg_2',
        'chatId': 'chat_1',
        'senderId': 'user_2',
        'content': 'Hi there!',
        'type': 'text',
        'createdAt': '2025-06-01T11:00:00.000Z',
        'isRead': true,
      };
      final msg = ChatMessage.fromJson(json);
      expect(msg.senderName, isNull);
      expect(msg.isRead, true);
    });

    test('fromJson defaults to empty strings for missing fields', () {
      final json = {
        'senderId': 'user_3',
        'createdAt': '2025-06-01T12:00:00.000Z',
      };
      final msg = ChatMessage.fromJson(json);
      expect(msg.id, '');
      expect(msg.content, '');
      expect(msg.type, 'text');
    });

    test('toJson round-trips correctly', () {
      final msg = ChatMessage(
        id: 'msg_3',
        chatId: 'chat_1',
        senderId: 'user_1',
        senderName: 'John',
        content: 'Test',
        type: 'text',
        createdAt: DateTime(2025, 6, 1),
        isRead: false,
      );
      final json = msg.toJson();
      expect(json['id'], 'msg_3');
      expect(json['content'], 'Test');
      expect(json['senderName'], 'John');
    });

    test('fromJson handles missing sender gracefully', () {
      final json = {
        'id': 'msg_4',
        'chatId': 'chat_1',
        'senderId': 'user_4',
        'content': 'No sender object',
        'type': 'text',
        'createdAt': '2025-06-01T13:00:00.000Z',
        'isRead': false,
      };
      final msg = ChatMessage.fromJson(json);
      expect(msg.senderName, isNull);
      expect(msg.senderAvatarUrl, isNull);
    });
  });
}
