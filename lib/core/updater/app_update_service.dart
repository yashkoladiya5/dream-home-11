import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_theme.dart';
import 'app_version.dart';

enum UpdateStatus { upToDate, updateRecommended, updateRequired }

class UpdateInfo {
  final String currentVersion;
  final String minimumVersion;
  final String latestVersion;
  final String updateUrl;

  const UpdateInfo({
    required this.currentVersion,
    required this.minimumVersion,
    required this.latestVersion,
    required this.updateUrl,
  });

  UpdateStatus get status {
    if (_compareVersions(currentVersion, minimumVersion) < 0) {
      return UpdateStatus.updateRequired;
    }
    if (_compareVersions(currentVersion, latestVersion) < 0) {
      return UpdateStatus.updateRecommended;
    }
    return UpdateStatus.upToDate;
  }

  static int _compareVersions(String a, String b) {
    final partsA = a.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final partsB = b.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final len = partsA.length > partsB.length ? partsA.length : partsB.length;
    for (var i = 0; i < len; i++) {
      final va = i < partsA.length ? partsA[i] : 0;
      final vb = i < partsB.length ? partsB[i] : 0;
      if (va < vb) return -1;
      if (va > vb) return 1;
    }
    return 0;
  }
}

class AppUpdateService {
  static const String _defaultMinimumVersion = '1.0.0';
  static const String _defaultLatestVersion = '1.0.0';
  static const String _defaultUpdateUrl =
      'https://play.google.com/store/apps/details?id=com.dreamhome11.app';

  Future<UpdateInfo> checkForUpdate({
    String? minimumVersion,
    String? latestVersion,
    String? updateUrl,
  }) async {
    return UpdateInfo(
      currentVersion: AppVersion.current,
      minimumVersion: minimumVersion ?? _defaultMinimumVersion,
      latestVersion: latestVersion ?? _defaultLatestVersion,
      updateUrl: updateUrl ?? _defaultUpdateUrl,
    );
  }
}

final updateServiceProvider = Provider<AppUpdateService>((ref) {
  return AppUpdateService();
});

final updateInfoProvider = FutureProvider<UpdateInfo>((ref) async {
  final service = ref.watch(updateServiceProvider);
  return service.checkForUpdate();
});

class UpdateDialog extends StatelessWidget {
  final UpdateInfo updateInfo;

  const UpdateDialog({super.key, required this.updateInfo});

  static Future<void> showIfNeeded(BuildContext context, UpdateInfo info) {
    if (info.status == UpdateStatus.upToDate) return Future.value();
    return showDialog(
      context: context,
      barrierDismissible: info.status != UpdateStatus.updateRequired,
      builder: (_) => UpdateDialog(updateInfo: info),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isRequired = updateInfo.status == UpdateStatus.updateRequired;
    if (isRequired) {
      return _requiredUpdate(context);
    }
    return _recommendedUpdate(context);
  }

  Widget _requiredUpdate(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: AppTheme.darkSlate,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.system_update_rounded,
                  size: 80,
                  color: AppTheme.primaryRed,
                ),
                const SizedBox(height: 24),
                Text(
                  'Update Required',
                  style: Theme.of(context).textTheme.headlineLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                Text(
                  'A new version of Dream Home 11 is required to continue.',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Current: v${updateInfo.currentVersion} \u2192 Required: v${updateInfo.minimumVersion}',
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: AppTheme.greyMedium),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _launchUpdate(updateInfo.updateUrl),
                    icon: const Icon(Icons.open_in_new),
                    label: const Text('Update Now'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _recommendedUpdate(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppTheme.secondarySlate,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      title: const Row(
        children: [
          Icon(Icons.new_releases_rounded, color: AppTheme.goldYellow),
          SizedBox(width: 8),
          Text('New Version Available'),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Version ${updateInfo.latestVersion} is now available.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 4),
          Text(
            'You are currently on v${updateInfo.currentVersion}.',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: AppTheme.greyMedium),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Later'),
        ),
        ElevatedButton.icon(
          onPressed: () {
            _launchUpdate(updateInfo.updateUrl);
            Navigator.of(context).pop();
          },
          icon: const Icon(Icons.open_in_new, size: 18),
          label: const Text('Update'),
        ),
      ],
    );
  }

  Future<void> _launchUpdate(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
