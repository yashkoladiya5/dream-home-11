import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class MaintenanceScreen extends StatelessWidget {
  final String? message;
  final bool isVersionRequired;

  const MaintenanceScreen({
    super.key,
    this.message,
    this.isVersionRequired = false,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  isVersionRequired ? Icons.system_update_rounded : Icons.construction_rounded,
                  size: 80,
                  color: AppTheme.goldYellow,
                ),
                const SizedBox(height: 24),
                Text(
                  isVersionRequired ? 'Update Required' : 'Under Maintenance',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  message ??
                      (isVersionRequired
                          ? 'A new version of Dream Home 11 is available. Please update your app to continue.'
                          : 'Dream Home 11 is currently undergoing scheduled maintenance. We\'ll be back shortly!'),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.greyMedium,
                    height: 1.5,
                  ),
                ),
                if (isVersionRequired) ...[
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryRed,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Update Now'),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                if (!isVersionRequired)
                  Text(
                    'Estimated time: 1-2 hours',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.greyMedium,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
