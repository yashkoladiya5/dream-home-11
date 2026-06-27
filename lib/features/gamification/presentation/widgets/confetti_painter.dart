import 'dart:math' as math;
import 'package:flutter/material.dart';

class ConfettiParticle {
  double x, y;
  double speed;
  double size;
  Color color;
  double rotation;
  double rotationSpeed;
  double horizontalDrift;

  ConfettiParticle({
    required this.x,
    required this.y,
    required this.speed,
    required this.size,
    required this.color,
    required this.rotation,
    required this.rotationSpeed,
    required this.horizontalDrift,
  });
}

class ConfettiPainter extends CustomPainter {
  final List<ConfettiParticle> particles;

  ConfettiPainter(this.particles);

  @override
  void paint(Canvas canvas, Size size) {
    for (final p in particles) {
      canvas.save();
      canvas.translate(p.x, p.y);
      canvas.rotate(p.rotation);

      final paint = Paint()
        ..color = p.color
        ..style = PaintingStyle.fill;

      canvas.drawRect(
        Rect.fromCenter(
          center: Offset.zero,
          width: p.size,
          height: p.size * 0.6,
        ),
        paint,
      );

      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(ConfettiPainter oldDelegate) => true;
}

class ConfettiWidget extends StatefulWidget {
  final Widget child;

  const ConfettiWidget({super.key, required this.child});

  @override
  State<ConfettiWidget> createState() => _ConfettiWidgetState();
}

class _ConfettiWidgetState extends State<ConfettiWidget>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late List<ConfettiParticle> _particles;
  final _random = math.Random();

  static const _colors = [
    Color(0xFFFFD700), // gold
    Color(0xFFFF4136), // red
    Color(0xFF2ECC40), // green
    Color(0xFF0074D9), // blue
    Colors.white,
  ];

  @override
  void initState() {
    super.initState();
    _particles = List.generate(30, (_) => _createParticle());
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();
    _controller.addListener(_updateParticles);
  }

  ConfettiParticle _createParticle() {
    return ConfettiParticle(
      x: _random.nextDouble() * 400,
      y: _random.nextDouble() * 600 - 600,
      speed: 80 + _random.nextDouble() * 120,
      size: 6 + _random.nextDouble() * 8,
      color: _colors[_random.nextInt(_colors.length)],
      rotation: _random.nextDouble() * 2 * math.pi,
      rotationSpeed: (_random.nextDouble() - 0.5) * 4,
      horizontalDrift: (_random.nextDouble() - 0.5) * 40,
    );
  }

  void _updateParticles() {
    final dt = _controller.duration!.inMicroseconds > 0
        ? _controller.lastElapsedDuration!.inMicroseconds /
            _controller.duration!.inMicroseconds
        : 0.016;
    final height = context.size?.height ?? 600;
    final width = context.size?.width ?? 400;

    for (final p in _particles) {
      p.y += p.speed * dt;
      p.x += p.horizontalDrift * dt;
      p.rotation += p.rotationSpeed * dt;

      if (p.y > height + p.size) {
        p.y = -p.size;
        p.x = _random.nextDouble() * width;
        p.rotation = _random.nextDouble() * 2 * math.pi;
      }
    }
    setState(() {});
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        Positioned.fill(
          child: IgnorePointer(
            child: CustomPaint(
              painter: ConfettiPainter(_particles),
            ),
          ),
        ),
      ],
    );
  }
}
