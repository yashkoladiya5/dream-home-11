import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/config_provider.dart';
import '../screens/maintenance_screen.dart';

class ConfigGate extends ConsumerStatefulWidget {
  final Widget child;

  const ConfigGate({super.key, required this.child});

  @override
  ConsumerState<ConfigGate> createState() => _ConfigGateState();
}

class _ConfigGateState extends ConsumerState<ConfigGate> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(configNotifierProvider.notifier).startPolling();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    ref.read(configNotifierProvider.notifier).stopPolling();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(configNotifierProvider.notifier).refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final configAsync = ref.watch(configNotifierProvider);

    return configAsync.when(
      data: (config) {
        if (config.maintenanceMode) {
          return const MaintenanceScreen();
        }
        return widget.child;
      },
      loading: () => widget.child,
      error: (_, _) => widget.child,
    );
  }
}
