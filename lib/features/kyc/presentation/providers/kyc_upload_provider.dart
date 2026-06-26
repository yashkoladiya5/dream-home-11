import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import 'kyc_provider.dart';

class KycUploadState {
  final Map<String, bool> uploading;
  final Map<String, double> progress;
  final Map<String, String?> uploadedUrls;
  final Map<String, String?> errors;

  const KycUploadState({
    this.uploading = const {},
    this.progress = const {},
    this.uploadedUrls = const {},
    this.errors = const {},
  });

  KycUploadState copyWith({
    Map<String, bool>? uploading,
    Map<String, double>? progress,
    Map<String, String?>? uploadedUrls,
    Map<String, String?>? errors,
  }) {
    return KycUploadState(
      uploading: uploading ?? this.uploading,
      progress: progress ?? this.progress,
      uploadedUrls: uploadedUrls ?? this.uploadedUrls,
      errors: errors ?? this.errors,
    );
  }

  bool isUploading(String docType) => uploading[docType] ?? false;
  double getProgress(String docType) => progress[docType] ?? 0.0;
  String? getUrl(String docType) => uploadedUrls[docType];
  String? getError(String docType) => errors[docType];
}

class KycUploadNotifier extends StateNotifier<KycUploadState> {
  final Dio _dio;
  final Ref _ref;

  KycUploadNotifier(this._dio, this._ref) : super(const KycUploadState());

  Future<bool> uploadDocument({
    required String documentType,
    required File file,
  }) async {
    state = state.copyWith(
      uploading: {...state.uploading, documentType: true},
      progress: {...state.progress, documentType: 0.0},
      errors: {...state.errors, documentType: null},
    );

    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: '$documentType.jpg',
        ),
        'documentType': documentType,
      });

      final response = await _dio.post(
        '/api/v1/kyc/upload-document',
        data: formData,
        onSendProgress: (sent, total) {
          if (total > 0) {
            state = state.copyWith(
              progress: {...state.progress, documentType: sent / total},
            );
          }
        },
      );

      final url = response.data['url'] as String?;

      state = state.copyWith(
        uploading: {...state.uploading, documentType: false},
        progress: {...state.progress, documentType: 1.0},
        uploadedUrls: {...state.uploadedUrls, documentType: url},
      );

      _ref.invalidate(kycStatusProvider);
      return true;
    } catch (e) {
      state = state.copyWith(
        uploading: {...state.uploading, documentType: false},
        progress: {...state.progress, documentType: 0.0},
        errors: {...state.errors, documentType: _extractError(e)},
      );
      return false;
    }
  }

  String _extractError(dynamic error) {
    if (error is DioException) {
      final message = error.response?.data?['message'];
      if (message is String) return message;
      if (message is List) return message.join(', ');
    }
    return 'Upload failed. Please try again.';
  }

  void clearError(String documentType) {
    state = state.copyWith(
      errors: {...state.errors, documentType: null},
    );
  }

  void reset() {
    state = const KycUploadState();
  }
}

final kycUploadProvider = StateNotifierProvider<KycUploadNotifier, KycUploadState>((ref) {
  final dio = ref.watch(apiClientProvider);
  return KycUploadNotifier(dio, ref);
});
