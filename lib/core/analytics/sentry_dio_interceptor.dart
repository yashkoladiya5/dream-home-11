import 'package:dio/dio.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

class SentryDioInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    Sentry.addBreadcrumb(Breadcrumb(
      message: '${options.method} ${options.uri}',
      category: 'http',
      level: SentryLevel.info,
      data: {
        'url': options.uri.toString(),
        'method': options.method,
      },
    ));
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    Sentry.addBreadcrumb(Breadcrumb(
      message: '${response.requestOptions.method} ${response.requestOptions.uri} -> ${response.statusCode}',
      category: 'http',
      level: response.statusCode != null && response.statusCode! >= 400
          ? SentryLevel.warning
          : SentryLevel.info,
      data: {
        'url': response.requestOptions.uri.toString(),
        'method': response.requestOptions.method,
        'status_code': response.statusCode,
      },
    ));
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final statusCode = err.response?.statusCode ?? 0;

    if (statusCode >= 500 || statusCode == 0) {
      Sentry.captureException(
        err,
        stackTrace: err.stackTrace,
        withScope: (scope) {
          scope.setTag('endpoint', err.requestOptions.path);
          scope.setTag('status_code', statusCode.toString());
          scope.setExtra('request_url', err.requestOptions.uri.toString());
          scope.setExtra('request_method', err.requestOptions.method);
          if (err.response?.data != null) {
            scope.setExtra('response_body', err.response?.data);
          }
        },
      );
    }

    Sentry.addBreadcrumb(Breadcrumb(
      message: '${err.requestOptions.method} ${err.requestOptions.uri} -> $statusCode',
      category: 'http',
      level: SentryLevel.error,
      data: {
        'url': err.requestOptions.uri.toString(),
        'method': err.requestOptions.method,
        'status_code': statusCode,
      },
    ));

    handler.next(err);
  }
}
