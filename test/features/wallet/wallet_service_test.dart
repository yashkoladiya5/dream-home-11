import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:dio/dio.dart';
import 'package:dream_home_11/features/wallet/data/models/wallet_summary.dart';
import 'package:dream_home_11/features/wallet/data/models/transaction.dart';

class MockDio extends Mock implements Dio {}

void main() {
  group('WalletSummary', () {
    test('fromJson parses correctly', () {
      final json = {
        'totalCashDeposited': 5000.0,
        'totalCashSpent': 2000.0,
        'totalPointsEarned': 1000,
        'totalPointsSpent': 300,
        'totalWithdrawn': 500.0,
      };
      final summary = WalletSummary.fromJson(json);
      expect(summary.totalCashDeposited, 5000.0);
      expect(summary.netCash, 2500.0);
      expect(summary.netPoints, 700);
    });

    test('netCash handles missing values', () {
      final json = <String, dynamic>{};
      final summary = WalletSummary.fromJson(json);
      expect(summary.netCash, 0.0);
    });

    test('fromJson defaults to zero for missing fields', () {
      final json = {'totalCashDeposited': 100.0};
      final summary = WalletSummary.fromJson(json);
      expect(summary.totalCashDeposited, 100.0);
      expect(summary.totalCashSpent, 0.0);
      expect(summary.totalPointsEarned, 0);
    });
  });

  group('TransactionModel', () {
    test('fromJson parses deposit transaction', () {
      final json = {
        'id': 'txn_1',
        'userId': 'user_1',
        'type': 'deposit',
        'cashAmount': 500,
        'pointsAmount': 0,
        'createdAt': '2025-01-01T00:00:00.000Z',
      };
      final txn = TransactionModel.fromJson(json);
      expect(txn.type, 'deposit');
      expect(txn.typeLabel, 'Cash Deposit');
      expect(txn.isCredit, true);
    });

    test('fromJson parses withdrawal transaction', () {
      final json = {
        'id': 'txn_2',
        'userId': 'user_1',
        'type': 'withdrawal',
        'cashAmount': -200,
        'pointsAmount': 0,
        'createdAt': '2025-01-02T00:00:00.000Z',
      };
      final txn = TransactionModel.fromJson(json);
      expect(txn.typeLabel, 'Withdrawal');
      expect(txn.isCredit, false);
    });

    test('fromJson handles string numeric values', () {
      final json = {
        'id': 'txn_3',
        'userId': 'user_1',
        'type': 'points_earned',
        'cashAmount': '0',
        'pointsAmount': '50',
        'createdAt': '2025-01-03T00:00:00.000Z',
      };
      final txn = TransactionModel.fromJson(json);
      expect(txn.pointsAmount, 50);
      expect(txn.isCredit, true);
    });

    test('typeLabel for unknown type formats nicely', () {
      final json = {
        'id': 'txn_4',
        'userId': 'user_1',
        'type': 'bonus_cashback',
        'cashAmount': 100,
        'pointsAmount': 0,
        'createdAt': '2025-01-04T00:00:00.000Z',
      };
      final txn = TransactionModel.fromJson(json);
      expect(txn.typeLabel, 'Bonus Cashback');
    });
  });
}
