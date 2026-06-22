import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/aurora_theme.dart';
import 'motion_tokens.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  AuroraLoader — لودر مُعلّم يستبدل CircularProgressIndicator   ║
/// ║                                                               ║
/// ║  قوسان يدوران بسرعتين مع توهّج ember. عند reduce-motion يعرض   ║
/// ║  حلقة ثابتة هادئة. استعمله أينما كان هناك انتظار.              ║
/// ╚══════════════════════════════════════════════════════════════╝
class AuroraLoader extends StatefulWidget {
  const AuroraLoader({super.key, this.size = 36, this.color, this.stroke = 3});

  final double size;
  final Color? color;
  final double stroke;

  @override
  State<AuroraLoader> createState() => _AuroraLoaderState();
}

class _AuroraLoaderState extends State<AuroraLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1100));
    if (Motion.decorative) _c.repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.color ?? AuroraColors.ember;
    return RepaintBoundary(
      child: SizedBox(
        width: widget.size,
        height: widget.size,
        child: AnimatedBuilder(
          animation: _c,
          builder: (context, _) => CustomPaint(
            painter: _LoaderPainter(_c.value, color, widget.stroke),
          ),
        ),
      ),
    );
  }
}

class _LoaderPainter extends CustomPainter {
  _LoaderPainter(this.t, this.color, this.stroke);
  final double t;
  final Color color;
  final double stroke;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = (size.width - stroke) / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);

    // حلقة خلفية خافتة
    final bg = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..color = color.withValues(alpha: 0.15);
    canvas.drawCircle(center, radius, bg);

    // قوس أمامي يدور
    final arc = Paint()
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = stroke
      ..shader = SweepGradient(
        colors: [color.withValues(alpha: 0), color],
        transform: GradientRotation(t * 2 * math.pi),
      ).createShader(rect);
    final start = t * 2 * math.pi;
    canvas.drawArc(rect, start, math.pi * 1.4, false, arc);
  }

  @override
  bool shouldRepaint(_LoaderPainter old) => old.t != t || old.color != color;
}
