import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final deepLinkProvider = Provider<Uri?>((ref) => null);

class DeepLinkConfig {
  static const _host = 'dreamhome11.com';

  static void configure() {
    final channel = MethodChannel('com.dreamhome11.dream_home_11/deeplink');
    channel.setMethodCallHandler((call) async {
      if (call.method == 'handleDeepLink') {
        final uriString = call.arguments as String?;
        if (uriString != null) {
          final uri = Uri.tryParse(uriString);
          if (uri != null) {
            DeepLinkHelper.handleIncoming(uri);
          }
        }
      }
      return null;
    });
  }
}

class DeepLinkHelper {
  DeepLinkHelper._();

  static void handleIncoming(Uri uri) {
    debugPrint('DeepLink received: $uri');
  }

  static Uri? parseFromString(String uriString) {
    return Uri.tryParse(uriString);
  }

  static String? toGoRouterPath(Uri uri) {
    if (uri.host != DeepLinkConfig._host) return null;

    final segments = uri.pathSegments.where((s) => s.isNotEmpty).toList();
    if (segments.isEmpty) return '/home';

    switch (segments[0]) {
      case 'contest':
        if (segments.length >= 2) {
          return '/contest/${segments[1]}';
        }
        return '/home';

      case 'referral':
        if (segments.length >= 2) {
          return '/invite?code=${segments[1]}';
        }
        return '/invite';

      case 'profile':
        return '/home';

      case 'wallet':
        return '/wallet';

      case 'rewards':
        if (segments.length >= 2) {
          return '/rewards/${segments[1]}';
        }
        return '/rewards';

      case 'contests':
        return '/home';

      default:
        return null;
    }
  }
}

extension DeepLinkUriParser on Uri {
  String? toGoRouterLocation() {
    return DeepLinkHelper.toGoRouterPath(this);
  }
}
