import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/config/presentation/widgets/config_gate.dart';
import 'features/notifications/services/notification_handler.dart';
import 'core/performance/performance_monitor.dart';
import 'core/security/device_security_service.dart';
import 'core/security/security_guard_screen.dart';
import 'core/performance/image_preloader.dart';

bool isFirebaseInitialized = false;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp();
    isFirebaseInitialized = true;
  } catch (e) {
    debugPrint('Firebase initialization failed: $e');
  }

  runApp(
    ProviderScope(
      child: _AppStartup(
        child: const DreamHomeApp(),
      ),
    ),
  );
}

class _AppStartup extends ConsumerStatefulWidget {
  final Widget child;

  const _AppStartup({required this.child});

  @override
  ConsumerState<_AppStartup> createState() => _AppStartupState();
}

class _AppStartupState extends ConsumerState<_AppStartup> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(imagePreloaderProvider).preCacheCommonImages();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer(
      builder: (context, ref, _) {
        final integrityAsync = ref.watch(deviceSecurityProvider);
        return integrityAsync.when(
          data: (result) {
            if (!result.isSecure) {
              return SecurityGuardScreen(indicators: result.rootIndicators);
            }
            return ConfigGate(child: widget.child);
          },
          loading: () => ConfigGate(child: widget.child),
          error: (_, _) => ConfigGate(child: widget.child),
        );
      },
    );
  }
}

class DreamHomeApp extends ConsumerStatefulWidget {
  const DreamHomeApp({super.key});

  @override
  ConsumerState<DreamHomeApp> createState() => _DreamHomeAppState();
}

class _DreamHomeAppState extends ConsumerState<DreamHomeApp> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationHandlerProvider).initialize();
      ref.watch(performanceMonitorProvider);
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Dream Home 11',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
    );
  }
}
