import 'dart:async';
import 'dart:ui' show ImageFilter;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/connectivity_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/updater/app_version.dart';
import '../../../../core/updater/app_update_service.dart';
import '../providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );
    _scaleAnimation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _controller.forward();
    _navigateToNext();
  }

  Future<void> _navigateToNext() async {
    await Future.delayed(const Duration(milliseconds: 2500));
    if (!mounted) return;

    final connectivityService = ref.read(connectivityServiceProvider);
    final isOnline = await connectivityService.checkConnectivity();

    if (!mounted) return;

    if (!isOnline) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Connecting...'),
            duration: Duration(seconds: 5),
          ),
        );
      }
      try {
        await connectivityService.onConnectivityChanged
            .firstWhere((online) => online)
            .timeout(const Duration(seconds: 5));
      } catch (_) {}
    }

    if (!mounted) return;

    try {
      final updateInfo =
          await ref.read(updateServiceProvider).checkForUpdate();
      if (mounted) {
        await UpdateDialog.showIfNeeded(context, updateInfo);
      }
    } catch (_) {}

    if (!mounted) return;

    try {
      final isLoggedIn =
          await ref.read(authProvider.notifier).checkPersistence();
      if (mounted) {
        if (isLoggedIn) {
          context.go('/home');
        } else {
          context.go('/language');
        }
      }
    } catch (e) {
      if (mounted) {
        context.go('/language');
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppTheme.darkSlate,
              AppTheme.primaryRed.withValues(alpha: 0.12),
              AppTheme.darkSlate,
              AppTheme.darkSlate,
            ],
            stops: const [0.0, 0.25, 0.6, 1.0],
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              top: -100,
              right: -100,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.primaryRed.withValues(alpha: 0.05),
                ),
              ),
            ),
            Positioned(
              bottom: -80,
              left: -80,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.primaryRed.withValues(alpha: 0.08),
                ),
              ),
            ),
            BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
              child: const SizedBox.expand(),
            ),
            Center(
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ScaleTransition(
                      scale: _scaleAnimation,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryRed,
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primaryRed.withValues(alpha: 0.4),
                              blurRadius: 20,
                              spreadRadius: 2,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.home_work_rounded,
                          size: 64,
                          color: AppTheme.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    ShaderMask(
                      shaderCallback: (bounds) =>
                          AppTheme.primaryGradient.createShader(bounds),
                      child: Text(
                        'DREAM HOME 11',
                        style:
                            Theme.of(context).textTheme.displayMedium?.copyWith(
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.5,
                                  color: Colors.white,
                                ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Play. Earn points. Win your home.',
                      style:
                          Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: AppTheme.greyMedium,
                                letterSpacing: 0.5,
                              ),
                    ),
                    const SizedBox(height: 48),
                    const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation<Color>(
                            AppTheme.primaryRed),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              bottom: 32,
              left: 0,
              right: 0,
              child: Center(
                child: Text(
                  'v${AppVersion.current}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.greyMedium.withValues(alpha: 0.6),
                      ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
