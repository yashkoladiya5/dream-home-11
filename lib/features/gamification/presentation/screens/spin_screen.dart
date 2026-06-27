import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/spin_models.dart';
import '../providers/spin_provider.dart';
import '../widgets/spin_wheel_painter.dart';

class SpinScreen extends ConsumerStatefulWidget {
  const SpinScreen({super.key});

  @override
  ConsumerState<SpinScreen> createState() => _SpinScreenState();
}

class _SpinScreenState extends ConsumerState<SpinScreen>
    with TickerProviderStateMixin {
  late AnimationController _spinController;
  late Animation<double> _spinAnimation;
  double _currentRotation = 0;
  bool _isSpinning = false;
  bool _hasCheckedStatus = false;

  @override
  void initState() {
    super.initState();
    _spinController = AnimationController(
      duration: const Duration(milliseconds: 3500),
      vsync: this,
    );

    _spinAnimation = CurvedAnimation(
      parent: _spinController,
      curve: Curves.easeOutCubic,
    );

    _spinController.addListener(() {
      setState(() {
        _currentRotation = _spinAnimation.value;
      });
    });

    _spinController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        setState(() {
          _isSpinning = false;
        });
        final spinState = ref.read(spinProvider);
        spinState.whenData((result) {
          if (result != null && result.success && mounted) {
            _showWinDialog(result);
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _spinController.dispose();
    super.dispose();
  }

  void _doSpin() async {
    if (_isSpinning) return;

    setState(() {
      _isSpinning = true;
    });

    await ref.read(spinProvider.notifier).spin();

    final spinState = ref.read(spinProvider);
    final result = spinState.valueOrNull;

    if (result == null || !result.success) {
      setState(() {
        _isSpinning = false;
      });
      if (result != null && !result.success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.message),
            backgroundColor: AppTheme.primaryRed,
          ),
        );
      }
      return;
    }

    final segmentAngle = 2 * math.pi / 7;
    final targetOffset = -(result.segmentIndex * segmentAngle + segmentAngle / 2);
    final fullRotations = 5 * 2 * math.pi;
    final totalRotation = fullRotations + targetOffset;

    final startRotation = _currentRotation % (2 * math.pi);
    _spinAnimation = Tween<double>(
      begin: startRotation,
      end: startRotation + totalRotation,
    ).animate(CurvedAnimation(
      parent: _spinController,
      curve: Curves.easeOutCubic,
    ));

    _spinController.reset();
    _spinController.forward();
  }

  void _showWinDialog(SpinResult result) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1A1A2E),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: BorderSide(
              color: AppTheme.goldYellow.withValues(alpha: 0.4),
            ),
          ),
          content: SizedBox(
            width: MediaQuery.of(context).size.width * 0.75,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 16),
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [AppTheme.goldYellow, Color(0xFFFF6B35)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.goldYellow.withValues(alpha: 0.4),
                        blurRadius: 20,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.emoji_events_rounded,
                    color: Colors.white,
                    size: 40,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'CONGRATULATIONS!',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                        color: AppTheme.goldYellow,
                        letterSpacing: 1.5,
                      ),
                ),
                const SizedBox(height: 12),
                Text(
                  'You won',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppTheme.greyMedium,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${result.prizePoints} Points',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.goldYellow.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    result.tier.toUpperCase(),
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppTheme.goldYellow,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(ctx).pop();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.goldYellow,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'COLLECT',
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final spinStatus = ref.watch(spinStatusProvider);

    return Scaffold(
      backgroundColor: AppTheme.darkSlate,
      appBar: AppBar(
        title: const Text('Daily Spin'),
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        backgroundColor: AppTheme.darkSlate,
      ),
      body: SafeArea(
        child: spinStatus.when(
          data: (status) {
            if (!_hasCheckedStatus) {
              _hasCheckedStatus = true;
            }

            if (!status.canSpin && !_isSpinning) {
              return _buildLimitReached(status);
            }

            return _buildSpinWheel();
          },
          loading: () => const Center(
            child: CircularProgressIndicator(
              color: AppTheme.goldYellow,
            ),
          ),
          error: (err, _) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  color: AppTheme.primaryRed,
                  size: 48,
                ),
                const SizedBox(height: 16),
                Text(
                  'Failed to load spin status',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.greyMedium,
                      ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => ref.refresh(spinStatusProvider),
                  child: const Text('RETRY'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSpinWheel() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 16),
          // Pointer
          Icon(
            Icons.keyboard_arrow_down_rounded,
            color: AppTheme.goldYellow,
            size: 36,
          ),
          const SizedBox(height: 4),
          // Wheel
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final wheelSize = constraints.maxWidth;
                return SizedBox(
                  width: wheelSize,
                  height: wheelSize,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CustomPaint(
                        size: Size(wheelSize, wheelSize),
                        painter: SpinWheelPainter(
                          rotation: _currentRotation,
                        ),
                      ),
                      // Center spin button
                      GestureDetector(
                        onTap: (_isSpinning || _spinController.isAnimating)
                            ? null
                            : _doSpin,
                        child: Container(
                          width: wheelSize * 0.22,
                          height: wheelSize * 0.22,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: AppTheme.primaryGradient,
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primaryRed.withValues(alpha: 0.5),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Center(
                            child: _isSpinning || _spinController.isAnimating
                                ? const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2.5,
                                    ),
                                  )
                                : const Text(
                                    'SPIN',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 32),
          Text(
            'Spin once per day to win bonus points!',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppTheme.greyMedium,
                ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildLimitReached(SpinStatus status) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.goldYellow.withValues(alpha: 0.1),
                border: Border.all(
                  color: AppTheme.goldYellow.withValues(alpha: 0.3),
                  width: 2,
                ),
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: AppTheme.goldYellow,
                size: 48,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Come Back Tomorrow!',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
            ),
            const SizedBox(height: 12),
            Text(
              "You've already spun today. Your next spin will be available at:",
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.greyMedium,
                  ),
            ),
            const SizedBox(height: 16),
            if (status.nextAvailableSpin != null)
              Text(
                _formatDate(status.nextAvailableSpin!),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.goldYellow,
                    ),
              ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.arrow_back_rounded, size: 18),
              label: const Text('GO BACK'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0x0CFFFFFF),
                foregroundColor: AppTheme.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: Color(0x1AFFFFFF)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      final h = dt.hour.toString().padLeft(2, '0');
      final m = dt.minute.toString().padLeft(2, '0');
      final d = dt.day.toString().padLeft(2, '0');
      final mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.month - 1];
      return '$d $mon, $h:$m';
    } catch (_) {
      return iso;
    }
  }
}
