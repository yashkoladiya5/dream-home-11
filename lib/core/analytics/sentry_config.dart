import 'package:sentry_flutter/sentry_flutter.dart';

class SentryConfig {
  static Future<void> configure() async {
    const dsn = String.fromEnvironment('SENTRY_DSN');
    if (dsn.isEmpty) return;

    const env = String.fromEnvironment('APP_ENV', defaultValue: 'dev');
    final version = String.fromEnvironment('APP_VERSION', defaultValue: '1.0.0');
    final buildNumber = String.fromEnvironment('APP_BUILD_NUMBER', defaultValue: '1');

    await SentryFlutter.init(
      (options) {
        options.dsn = dsn;
        options.environment = env;
        options.release = '$version+$buildNumber';
        options.tracesSampleRate = 0.2;
        options.attachScreenshot = true;
        options.attachViewHierarchy = true;
        options.sendDefaultPii = false;

        options.beforeSend = (event, hint) {
          if (event.exceptions != null) {
            for (final ex in event.exceptions!) {
              if (ex.type != null) {
                if (ex.type!.contains('AbortProgressResponseException') ||
                    ex.type!.contains('ConnectionRefusedError') ||
                    ex.type!.contains('TimeoutException') ||
                    ex.type!.contains('SocketException') && event.tags?['status_code'] == '429') {
                  return null;
                }
              }
            }
          }
          final sanitized = event.copyWith(
            user: event.user?.copyWith(
              email: null,
              ipAddress: null,
            ),
            tags: {
              ...event.tags ?? {},
              if (event.tags?.containsKey('request_body') == true)
                'request_body' : '[REDACTED]',
            },
          );
          return sanitized;
        };

        options.beforeBreadcrumb = (breadcrumb, hint) {
          if (breadcrumb == null) return null;
          if (breadcrumb.category == 'http' && breadcrumb.data?['url'] != null) {
            final uri = Uri.tryParse(breadcrumb.data!['url'] as String);
            if (uri != null && uri.queryParameters.isNotEmpty) {
              breadcrumb.data!['url'] = uri.replace(queryParameters: {}).toString();
            }
          }
          return breadcrumb;
        };
      },
      appRunner: () {},
    );
  }
}
