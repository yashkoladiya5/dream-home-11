import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'generated/app_localizations.dart';
import 'core/i18n/locale_provider.dart';
import 'core/network/connectivity_state.dart';
import 'core/performance/app_startup.dart';
import 'core/router/app_router.dart';
import 'core/router/deep_links.dart';
import 'core/theme/app_theme.dart';
import 'features/config/presentation/widgets/config_gate.dart';
import 'features/notifications/services/notification_handler.dart';
import 'core/performance/performance_monitor.dart';
import 'core/security/device_security_service.dart';
import 'core/security/security_guard_screen.dart';
import 'core/performance/image_preloader.dart';
import 'core/performance/performance_overlay.dart';
import 'package:flutter/scheduler.dart';
import 'core/performance/memory_profiler.dart';
import 'core/performance/rendering_analyzer.dart';
import 'core/performance/scroll_tracker.dart';
import 'core/performance/lazy_init.dart';

bool isFirebaseInitialized = false;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  DeepLinkConfig.configure();

  final startupService = AppStartupService();
  startupService.completePhase0();

  try {
    await Firebase.initializeApp();
    isFirebaseInitialized = true;
  } catch (e) {
    debugPrint('Firebase initialization failed: $e');
  }

  startupService.completePhase1();

  runApp(
    ProviderScope(
      overrides: [
        startupServiceProvider.overrideWithValue(startupService),
      ],
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
      ref.read(startupServiceProvider).completePhase2();

      final initializer = ref.read(appInitializerProvider);

      initializer.addService(
        DeferredInitService(
          serviceName: 'ImagePreloader',
          initFn: () =>
              ref.read(imagePreloaderProvider).preCacheCommonImages(),
        ),
        InitPriority.background,
      );

      initializer.addService(
        DeferredInitService(
          serviceName: 'MemoryProfiler',
          initFn: () async {
            ref.read(memoryProfilerProvider);
          },
        ),
        InitPriority.background,
      );

      initializer.addService(
        DeferredInitService(
          serviceName: 'RenderingAnalyzer',
          initFn: () async {
            ref.read(renderingAnalyzerProvider);
          },
        ),
        InitPriority.background,
      );

      initializer.initializeBackground();
      initializer.initializeIdle().then((_) {
        ref.read(startupServiceProvider).completePhase3();
      });
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

      final initializer = ref.read(appInitializerProvider);
      initializer.initializeRequired();

      final analyzer = ref.read(renderingAnalyzerProvider);
      SchedulerBinding.instance.addTimingsCallback((timings) {
        analyzer.onFrame(Duration.zero);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    final tracker = ref.watch(scrollTrackerProvider);
    final locale = ref.watch(localeProvider);

    return TrackedScrollConfiguration(
      tracker: tracker,
      child: PerformanceOverlayToggle(
        child: MaterialApp.router(
          title: 'Dream Home 11',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.darkTheme,
          locale: locale,
          supportedLocales: const [
            Locale('en'),
            Locale('hi'),
          ],
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          routerConfig: router,
          builder: (context, child) {
            return Stack(
              children: [
                ?child,
                const Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: ConnectivityBanner(),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
