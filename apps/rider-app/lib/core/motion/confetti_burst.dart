import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/aurora_theme.dart';
import 'motion_tokens.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  ConfettiBurst — انفجار قُصاصات احتفالي (CustomPainter)        ║
/// ║                                                               ║
/// ║  بلا حِزَم خارجية. يُشغَّل مرة عند [play]=true (إتمام رحلة /     ║
/// ║  5 نجوم / سحب أرباح). ضعه فوق المحتوى في Stack (IgnorePointer).║
/// ║  يحترم reduce-motion (لا شيء).                                 ║
/// ╚══════════════════════════════════════════════════════════════╝
class ConfettiBurst extends StatefulWidget {
  const ConfettiBurst({
    super.key,
    required this.play,
    this.count = 60,
    this.duration = const Duration(milliseconds: 2200),
    this.colors,
  });

  final bool play;
  final int count;
  final Duration duration;
  final List<Color>? colors;

  @override
  State<ConfettiBurst> createState() => _ConfettiBurstState();
}

class _ConfettiBurstState extends State<ConfettiBurst>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  late List<_Piece> _pieces;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: widget.duration);
    _pieces = _gen();
    if (widget.play && Motion.decorative) _c.forward(from: 0);
  }

  @override
  void didUpdateWidget(ConfettiBurst old) {
    super.didUpdateWidget(old);
    if (widget.play && !old.play && Motion.decorative) {
      _pieces = _gen();
      _c.forward(from: 0);
    }
  }

  List<_Piece> _gen() {
    final rnd = math.Random();
    final palette = widget.colors ??
        [
          AuroraColors.ember,
          AuroraColors.emberLight,
          AuroraColors.gold,
          AuroraColors.success,
          AuroraColors.pearl,
        ];
    return List.generate(widget.count, (i) {
      final angle = -math.pi / 2 + (rnd.nextDouble() - 0.5) * 1.8;
      final speed = 0.6 + rnd.nextDouble() * 0.9;
      return _Piece(
        angle: angle,
        speed: speed,
        color: palette[rnd.nextInt(palette.length)],
        size: 6 + rnd.nextDouble() * 8,
        spin: (rnd.nextDouble() - 0.5) * 12,
        drift: (rnd.nextDouble() - 0.5) * 0.4,
      );
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: RepaintBoundary(
        child: AnimatedBuilder(
          animation: _c,
          builder: (context, _) => _c.isAnimating || _c.isCompleted
              ? CustomPaint(
                  size: Size.infinite,
                  painter: _ConfettiPainter(_pieces, _c.value),
                )
              : const SizedBox.expand(),
        ),
      ),
    );
  }
}

class _Piece {
  _Piece({
    required this.angle,
    required this.speed,
    required this.color,
    required this.size,
    required this.spin,
    required this.drift,
  });
  final double angle;
  final double speed;
  final Color color;
  final double size;
  final double spin;
  final double drift;
}

class _ConfettiPainter extends CustomPainter {
  _ConfettiPainter(this.pieces, this.t);
  final List<_Piece> pieces;
  final double t;

  @override
  void paint(Canvas canvas, Size size) {
    final origin = Offset(size.width / 2, size.height * 0.42);
    final paint = Paint();
    final gravity = size.height * 1.1;
    for (final p in pieces) {
      final dist = p.speed * size.height * 0.7 * t;
      final x = origin.dx + math.cos(p.angle) * dist + p.drift * dist;
      final y = origin.dy + math.sin(p.angle) * dist + gravity * t * t * 0.5;
      final opacity = (1 - t).clamp(0.0, 1.0);
      paint.color = p.color.withValues(alpha: opacity);
      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(p.spin * t);
      canvas.drawRect(
        Rect.fromCenter(center: Offset.zero, width: p.size, height: p.size * 0.5),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_ConfettiPainter old) => old.t != t;
}
