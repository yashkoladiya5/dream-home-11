import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../dashboard/presentation/widgets/shimmer_widget.dart';
import '../providers/admin_config_provider.dart';

class AdminConfigScreen extends ConsumerStatefulWidget {
  const AdminConfigScreen({super.key});

  @override
  ConsumerState<AdminConfigScreen> createState() => _AdminConfigScreenState();
}

class _AdminConfigScreenState extends ConsumerState<AdminConfigScreen> {
  final Map<String, TextEditingController> _controllers = {};
  bool _hasChanges = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(adminConfigProvider.notifier).loadConfig());
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  void _initControllers(Map<String, dynamic> config) {
    _controllers.clear();
    for (final entry in config.entries) {
      _controllers[entry.key] = TextEditingController(
        text: entry.value.toString(),
      )..addListener(_onFieldChanged);
    }
  }

  void _onFieldChanged() {
    final changed = _controllers.entries.any((e) {
      final currentConfig = ref.read(adminConfigProvider).valueOrNull ?? {};
      return currentConfig[e.key]?.toString() != e.value.text;
    });
    if (changed != _hasChanges) {
      setState(() => _hasChanges = changed);
    }
  }

  Future<void> _save() async {
    final updated = <String, dynamic>{};
    for (final entry in _controllers.entries) {
      final raw = entry.value.text;
      final original = ref.read(adminConfigProvider).valueOrNull?[entry.key];
      if (original is num) {
        updated[entry.key] = num.tryParse(raw) ?? original;
      } else if (original is bool) {
        updated[entry.key] = raw.toLowerCase() == 'true';
      } else {
        updated[entry.key] = raw;
      }
    }

    final success = await ref.read(adminConfigProvider.notifier).updateConfig(updated);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'Config updated successfully' : 'Failed to update config'),
          backgroundColor: success ? AppTheme.emeraldGreen : AppTheme.primaryRed,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      if (success) {
        setState(() => _hasChanges = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final configAsync = ref.watch(adminConfigProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('System Config'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: configAsync.isLoading
          ? _buildShimmer()
          : configAsync.hasError
              ? _buildError(configAsync.error.toString())
              : _buildContent(configAsync.value ?? {}),
    );
  }

  Widget _buildContent(Map<String, dynamic> config) {
    if (_controllers.isEmpty && config.isNotEmpty) {
      _initControllers(config);
    }

    return Column(
      children: [
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => ref.read(adminConfigProvider.notifier).loadConfig(),
            child: config.isEmpty
                ? _buildEmpty()
                : ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                    children: config.entries.map((entry) => _buildConfigCard(entry.key, entry.value)).toList(),
                  ),
          ),
        ),
        if (_hasChanges)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryRed,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('Save Changes', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 15)),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildConfigCard(String key, dynamic value) {
    final controller = _controllers[key];
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: AppTheme.darkCardGradient,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x1FFFFFFF)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              key,
              style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 12, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: controller,
              style: GoogleFonts.outfit(color: Colors.white, fontSize: 14),
              decoration: InputDecoration(
                filled: true,
                fillColor: AppTheme.secondarySlate,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return RefreshIndicator(
      onRefresh: () => ref.read(adminConfigProvider.notifier).loadConfig(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: List.generate(6, (_) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: ShimmerCard(height: 100, borderRadius: 16),
        )),
      ),
    );
  }

  Widget _buildError(String message) {
    return RefreshIndicator(
      onRefresh: () => ref.read(adminConfigProvider.notifier).loadConfig(),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.3),
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  Icon(Icons.error_outline_rounded, size: 48, color: AppTheme.primaryRed.withValues(alpha: 0.7)),
                  const SizedBox(height: 12),
                  Text(
                    'Failed to load config',
                    style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message,
                    style: GoogleFonts.outfit(color: AppTheme.greyMedium.withValues(alpha: 0.6), fontSize: 12),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.settings_outlined, size: 64, color: AppTheme.greyMedium.withValues(alpha: 0.5)),
          const SizedBox(height: 16),
          Text('No config found', style: GoogleFonts.outfit(color: AppTheme.greyMedium, fontSize: 16)),
        ],
      ),
    );
  }
}
