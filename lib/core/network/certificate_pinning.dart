import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';

class CertificatePinning {
  CertificatePinning._();

  /// Production SHA-256 certificate fingerprints (SPKI hashes)
  /// These are the Base64-encoded SHA-256 hashes of the SubjectPublicKeyInfo
  /// of the server's SSL certificate. Replace with actual production cert hashes.
  /// Generate with: openssl s_client -connect example.com:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64
  static const _pinnedFingerprints = <String>[
    // TODO: Add production certificate fingerprints
    // 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  ];

  /// Whether any fingerprints are configured
  static bool get hasPinnedFingerprints => _pinnedFingerprints.isNotEmpty;

  /// Callback for HttpClient.badCertificateCallback
  /// Returns true if the certificate is trusted, false otherwise
  static bool verifyCertificate(X509Certificate cert, String host, int port) {
    if (_pinnedFingerprints.isEmpty) {
      debugPrint('[CertificatePinning] No fingerprints configured — allowing $host (pinning framework active, populate fingerprints to enforce)');
      return true;
    }

    try {
      final fingerprint = base64Encode(sha256.convert(cert.der).bytes);
      final isValid = _pinnedFingerprints.any((pinned) => pinned == fingerprint);

      if (!isValid) {
        debugPrint('[CertificatePinning] Certificate mismatch for $host');
        debugPrint('[CertificatePinning] Expected one of: $_pinnedFingerprints');
        debugPrint('[CertificatePinning] Got: $fingerprint');
      }

      return isValid;
    } catch (e) {
      debugPrint('[CertificatePinning] Error verifying certificate: $e');
      return kReleaseMode ? false : true;
    }
  }

  /// Creates an HttpClient with pinning configured
  static HttpClient createPinnedHttpClient() {
    final context = SecurityContext(withTrustedRoots: kReleaseMode ? false : true);
    final client = HttpClient(context: context);
    client.badCertificateCallback = verifyCertificate;
    return client;
  }
}
