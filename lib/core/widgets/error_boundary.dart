import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';

class ErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(FlutterErrorDetails details)? errorBuilder;
  final String? screenName;

  const ErrorBoundary({
    super.key,
    required this.child,
    this.errorBuilder,
    this.screenName,
  });

  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  FlutterErrorDetails? _error;

  @override
  void initState() {
    super.initState();
    FlutterError.onError = (details) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            _error = details;
          });
        }
      });
      FlutterError.presentError(details);
      if (!kReleaseMode) {
        debugPrint(
          '[ErrorBoundary] ${widget.screenName ?? 'Screen'} error: $details',
        );
      }
    };
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      if (widget.errorBuilder != null) {
        return widget.errorBuilder!(_error!);
      }
      return _defaultFallback();
    }
    return widget.child;
  }

  Widget _defaultFallback() {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: Theme.of(context).colorScheme.error,
              ),
              const SizedBox(height: 16),
              Text(
                'Something went wrong',
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                widget.screenName != null
                    ? 'Unable to load ${widget.screenName}'
                    : 'Unable to load this content',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () {
                  setState(() => _error = null);
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Try Again'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ErrorBoundaryWrapper extends StatelessWidget {
  final Widget child;
  final String? screenName;

  const ErrorBoundaryWrapper({super.key, required this.child, this.screenName});

  @override
  Widget build(BuildContext context) {
    return ErrorBoundary(screenName: screenName, child: child);
  }
}
