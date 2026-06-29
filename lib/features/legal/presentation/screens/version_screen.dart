import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class VersionInfo {
  final String label;
  final String value;
  const VersionInfo({required this.label, required this.value});
}

const List<VersionInfo> versionData = [
  VersionInfo(label: 'App Name', value: 'Dream Home 11'),
  VersionInfo(label: 'Package Name', value: 'com.dreamhome11.app'),
  VersionInfo(label: 'Version', value: '1.0.0'),
  VersionInfo(label: 'Build Number', value: '1'),
  VersionInfo(label: 'Build Type', value: 'Release'),
  VersionInfo(label: 'Flutter Version', value: '3.33.0'),
  VersionInfo(label: 'Dart Version', value: '3.8.0'),
  VersionInfo(label: 'Minimum OS', value: 'Android 8.0 / iOS 15.0'),
  VersionInfo(label: 'Target OS', value: 'Android 14 / iOS 17.0'),
  VersionInfo(label: 'Server Environment', value: 'Production'),
  VersionInfo(label: 'API Version', value: 'v1'),
  VersionInfo(label: 'Database', value: 'PostgreSQL 16'),
  VersionInfo(label: 'Cache', value: 'Redis 7'),
];

class VersionScreen extends StatefulWidget {
  const VersionScreen({super.key});
  @override
  State<VersionScreen> createState() => _VersionScreenState();
}

class _VersionScreenState extends State<VersionScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('App Info'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildHeader(context),
          const SizedBox(height: 24),
          Container(
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            child: Column(
              children: [
                for (int i = 0; i < versionData.length; i++) ...[
                  if (i > 0) const Divider(height: 1, color: Color(0x1FFFFFFF)),
                  _buildInfoRow(context, versionData[i]),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),
          Container(
            decoration: BoxDecoration(
              gradient: AppTheme.darkCardGradient,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0x1FFFFFFF)),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Icon(Icons.check_circle_rounded, color: AppTheme.emeraldGreen, size: 32),
                const SizedBox(height: 12),
                Text(
                  'All systems operational',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.emeraldGreen,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Server status: Online',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.greyMedium,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          TextButton(
            onPressed: () {},
            child: Text(
              'Open Source Licenses',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.primaryRed,
                decoration: TextDecoration.underline,
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            gradient: AppTheme.primaryGradient,
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Icon(Icons.info_rounded, color: Colors.white, size: 36),
        ),
        const SizedBox(height: 16),
        Text(
          'Dream Home 11',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Version 1.0.0 (Build 1)',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: AppTheme.greyMedium,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(BuildContext context, VersionInfo info) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Expanded(
            child: Text(
              info.label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.greyMedium,
              ),
            ),
          ),
          Text(
            info.value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
