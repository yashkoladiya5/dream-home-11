import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../banners/data/models/banner.dart';
import '../../../banners/presentation/providers/banner_provider.dart';
import 'shimmer_widget.dart';

class BannerCarousel extends ConsumerStatefulWidget {
  const BannerCarousel({super.key});

  @override
  ConsumerState<BannerCarousel> createState() => _BannerCarouselState();
}

class _BannerCarouselState extends ConsumerState<BannerCarousel> {
  late PageController _pageController;
  Timer? _timer;
  int _currentPage = 0;
  List<BannerModel>? _banners;

  static const List<LinearGradient> _defaultGradients = [
    LinearGradient(
      colors: [Color(0xFFD22C2C), Color(0xFF9E1B1B)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    LinearGradient(
      colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    LinearGradient(
      colors: [Color(0xFF10B981), Color(0xFF059669)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    LinearGradient(
      colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: 0);
    _startAutoScroll();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoScroll() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (_banners == null || _banners!.isEmpty) return;
      if (_pageController.hasClients) {
        final nextPage = (_currentPage + 1) % _banners!.length;
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  void _pauseAutoScroll() {
    _timer?.cancel();
  }

  void _resumeAutoScroll() {
    _startAutoScroll();
  }

  Color _parseHexColor(String hex) {
    hex = hex.replaceAll('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    return Color(int.parse(hex, radix: 16));
  }

  Color _darken(Color color, double factor) {
    return Color.fromRGBO(
      (color.r * 255.0 * factor).round().clamp(0, 255),
      (color.g * 255.0 * factor).round().clamp(0, 255),
      (color.b * 255.0 * factor).round().clamp(0, 255),
      1,
    );
  }

  LinearGradient _gradientFor(BannerModel banner, int index) {
    if (banner.backgroundColor != null && banner.backgroundColor!.isNotEmpty) {
      final color = _parseHexColor(banner.backgroundColor!);
      return LinearGradient(
        colors: [color, _darken(color, 0.6)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    }
    return _defaultGradients[index % _defaultGradients.length];
  }

  Widget _buildDot(int index) {
    final isActive = index == _currentPage;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.symmetric(horizontal: 4),
      width: isActive ? 8 : 6,
      height: isActive ? 8 : 6,
      decoration: BoxDecoration(
        color: isActive ? AppTheme.primaryRed : AppTheme.greyMedium.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }

  Widget _buildCard(BannerModel banner, int index) {
    return GestureDetector(
      onTap: () => context.push(banner.link ?? '/rewards'),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          gradient: _gradientFor(banner, index),
          borderRadius: BorderRadius.circular(16),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              banner.title,
              style: const TextStyle(
                color: AppTheme.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            if (banner.subtitle != null && banner.subtitle!.isNotEmpty)
              Text(
                banner.subtitle!,
                style: const TextStyle(
                  color: AppTheme.greyMedium,
                  fontSize: 13,
                ),
              ),
            const Spacer(),
            if (banner.linkLabel != null && banner.linkLabel!.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                decoration: BoxDecoration(
                  border: Border.all(color: AppTheme.white),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  banner.linkLabel!.toUpperCase(),
                  style: const TextStyle(
                    color: AppTheme.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ref.watch(bannerProvider).when(
      data: (banners) {
        _banners = banners;
        if (banners.isEmpty) return const SizedBox.shrink();
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              height: 170,
              child: Listener(
                onPointerDown: (_) => _pauseAutoScroll(),
                onPointerUp: (_) => _resumeAutoScroll(),
                onPointerCancel: (_) => _resumeAutoScroll(),
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: banners.length,
                  onPageChanged: (index) => setState(() => _currentPage = index),
                  itemBuilder: (context, index) => _buildCard(banners[index], index),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(banners.length, (i) => _buildDot(i)),
            ),
          ],
        );
      },
      loading: () => const Padding(
        padding: EdgeInsets.only(bottom: 12),
        child: ShimmerCard(height: 170, borderRadius: 16),
      ),
      error: (err, stack) => const SizedBox.shrink(),
    );
  }
}
