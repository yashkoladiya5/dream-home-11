import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../presentation/providers/config_provider.dart';
import '../../data/models/system_config.dart';

class AppConfigService {
  static bool isMaintenanceMode(Ref ref) {
    return ref.read(configNotifierProvider.notifier).isMaintenanceMode;
  }

  static bool needsUpdate(String currentVersion, SystemConfig config) {
    return _compareVersions(currentVersion, config.minAppVersionAndroid) < 0;
  }

  static int _compareVersions(String a, String b) {
    final aParts = a.split('.').map(int.parse).toList();
    final bParts = b.split('.').map(int.parse).toList();
    for (int i = 0; i < 3; i++) {
      final aVal = i < aParts.length ? aParts[i] : 0;
      final bVal = i < bParts.length ? bParts[i] : 0;
      if (aVal != bVal) return aVal - bVal;
    }
    return 0;
  }
}
