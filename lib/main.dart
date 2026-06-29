import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/config/presentation/widgets/config_gate.dart';
import 'features/notifications/services/notification_handler.dart';
import 'features/config/presentation/providers/config_provider.dart';

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

class _AppStartupState extends ConsumerState<_AppStartup> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    ref.read(configNotifierProvider.notifier).startPolling();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(notificationHandlerProvider).initialize();
      ref.read(configNotifierProvider.notifier).refresh();
    } else if (state == AppLifecycleState.paused) {
      ref.read(configNotifierProvider.notifier).stopPolling();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ConfigGate(child: widget.child);
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
