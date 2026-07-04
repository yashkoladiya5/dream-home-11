import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class RetryWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  final IconData icon;

  const RetryWidget({
    super.key,
    required this.message,
    required this.onRetry,
    this.icon = Icons.cloud_off,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: AppTheme.greyMedium),
            const SizedBox(height: 16),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppTheme.greyMedium,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

class RetryWrapper extends StatelessWidget {
  final bool hasError;
  final String? errorMessage;
  final VoidCallback onRetry;
  final Widget child;

  const RetryWrapper({
    super.key,
    required this.hasError,
    this.errorMessage,
    required this.onRetry,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    if (hasError) {
      return RetryWidget(
        message: errorMessage ?? 'Something went wrong. Please try again.',
        onRetry: onRetry,
      );
    }
    return child;
  }
}
