import 'dart:math' as math;
import 'package:flutter/material.dart';

const List<Color> _segmentColors = [
  Color(0xFFFF6B6B),
  Color(0xFFFFA94D),
  Color(0xFFFFD93D),
  Color(0xFF6BCB77),
  Color(0xFF4D96FF),
  Color(0xFF9B59B6),
  Color(0xFFFF6B9D),
];

const List<int> _segmentPrizes = [10, 12, 14, 15, 16, 18, 20];

class SpinWheelPainter extends CustomPainter {
  final double rotation;

  SpinWheelPainter({required this.rotation});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2;
    const segmentCount = 7;
    final sweepAngle = 2 * math.pi / segmentCount;

    // --- 5. Subtle shadow behind the wheel ---
    final shadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.3)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12);
    canvas.drawCircle(center, radius, shadowPaint);

    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(rotation);
    canvas.translate(-center.dx, -center.dy);

    for (int i = 0; i < segmentCount; i++) {
      final startAngle = -math.pi / 2 + (i * sweepAngle);
      final color = _segmentColors[i % _segmentColors.length];

      // --- 2. Segment gradients ---
      final lighterColor = Color.lerp(color, Colors.white, 0.4)!;

      final gradient = RadialGradient(
        center: FractionalOffset.center,
        colors: [lighterColor, color],
        stops: const [0.0, 1.0],
      );

      final path = Path();
      path.moveTo(center.dx, center.dy);
      path.arcTo(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        true,
      );
      path.close();

      final paint = Paint()
        ..shader = gradient.createShader(
          Rect.fromCircle(center: center, radius: radius),
        )
        ..style = PaintingStyle.fill;
      canvas.drawPath(path, paint);

      final borderPaint = Paint()
        ..color = Colors.white.withValues(alpha: 0.3)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1;
      canvas.drawPath(path, borderPaint);

      // --- 4. Improved text rendering with pill background ---
      final textAngle = startAngle + sweepAngle / 2;
      final textRadius = radius * 0.65;
      final textX = center.dx + textRadius * math.cos(textAngle);
      final textY = center.dy + textRadius * math.sin(textAngle);

      canvas.save();
      canvas.translate(textX, textY);
      canvas.rotate(textAngle + math.pi / 2);

      final textPainter = TextPainter(
        text: TextSpan(
          text: '${_segmentPrizes[i]}',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout();

      // Pill background
      final textW = textPainter.width + 16;
      final textH = textPainter.height + 8;
      final pillRect = RRect.fromRectAndRadius(
        Rect.fromCenter(
          center: Offset(-textPainter.width / 2, -textPainter.height / 2),
          width: textW,
          height: textH,
        ),
        const Radius.circular(10),
      );
      final pillPaint = Paint()
        ..color = Colors.black.withValues(alpha: 0.55)
        ..style = PaintingStyle.fill;
      canvas.drawRRect(pillRect, pillPaint);

      textPainter.paint(
        canvas,
        Offset(-textPainter.width / 2, -textPainter.height / 2),
      );

      canvas.restore();
    }

    canvas.restore();

    // --- 1. Decorative outer ring with alternating tick marks ---
    const tickCount = 56;
    final tickAngleStep = 2 * math.pi / tickCount;
    for (int i = 0; i < tickCount; i++) {
      final angle = i * tickAngleStep;
      final inner = radius - 2;
      final outer = i.isEven ? radius + 6 : radius + 12;
      final dx1 = center.dx + inner * math.cos(angle);
      final dy1 = center.dy + inner * math.sin(angle);
      final dx2 = center.dx + outer * math.cos(angle);
      final dy2 = center.dy + outer * math.sin(angle);
      final tickPaint = Paint()
        ..color = i.isEven ? const Color(0xFFFFD700) : Colors.white
        ..strokeWidth = 2.5
        ..style = PaintingStyle.stroke;
      canvas.drawLine(Offset(dx1, dy1), Offset(dx2, dy2), tickPaint);
    }

    final outerPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    canvas.drawCircle(center, radius, outerPaint);

    // --- 3. Inner glow ring ---
    final glowPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.4)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    canvas.drawCircle(center, radius * 0.20, glowPaint);

    final centerPaint = Paint()
      ..color = const Color(0xFF1A1A2E)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius * 0.18, centerPaint);

    final centerBorderPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawCircle(center, radius * 0.18, centerBorderPaint);
  }

  @override
  bool shouldRepaint(SpinWheelPainter oldDelegate) =>
      oldDelegate.rotation != rotation;
}
