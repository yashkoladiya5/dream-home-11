import 'package:flutter_test/flutter_test.dart';
import 'package:dream_home_11/features/kyc/data/models/kyc_status.dart';

void main() {
  group('KycStatusModel', () {
    test('fromJson parses approved status', () {
      final json = {
        'status': 'approved',
        'aadhaarVerified': true,
        'panVerified': true,
        'verifiedAt': '2025-01-15T10:00:00.000Z',
        'aadhaarFrontUrl': 'https://example.com/aadhaar_front.jpg',
        'aadhaarBackUrl': 'https://example.com/aadhaar_back.jpg',
        'panCardUrl': 'https://example.com/pan.jpg',
        'selfieUrl': 'https://example.com/selfie.jpg',
      };
      final kyc = KycStatusModel.fromJson(json);
      expect(kyc.isApproved, true);
      expect(kyc.isPending, false);
      expect(kyc.isRejected, false);
      expect(kyc.allDocumentsUploaded, true);
    });

    test('fromJson parses pending status', () {
      final json = {
        'status': 'pending',
        'aadhaarVerified': true,
        'panVerified': false,
      };
      final kyc = KycStatusModel.fromJson(json);
      expect(kyc.isPending, true);
      expect(kyc.isApproved, false);
    });

    test('fromJson parses rejected status with reason', () {
      final json = {
        'status': 'rejected',
        'rejectionReason': 'Document not clear',
      };
      final kyc = KycStatusModel.fromJson(json);
      expect(kyc.isRejected, true);
      expect(kyc.rejectionReason, 'Document not clear');
    });

    test('fromJson defaults to unverified', () {
      final json = <String, dynamic>{};
      final kyc = KycStatusModel.fromJson(json);
      expect(kyc.isUnverified, true);
      expect(kyc.status, 'unverified');
    });

    test('allDocumentsUploaded returns false when documents are missing', () {
      final json = {
        'status': 'pending',
        'aadhaarFrontUrl': 'https://example.com/front.jpg',
      };
      final kyc = KycStatusModel.fromJson(json);
      expect(kyc.allDocumentsUploaded, false);
    });
  });

  group('KycSubmissionResponse', () {
    test('fromJson parses submission response', () {
      final json = {
        'id': 'kyc_1',
        'status': 'pending',
      };
      final resp = KycSubmissionResponse.fromJson(json);
      expect(resp.id, 'kyc_1');
      expect(resp.status, 'pending');
    });
  });
}
