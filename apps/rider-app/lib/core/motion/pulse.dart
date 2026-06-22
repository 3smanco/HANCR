import 'package:flutter/material.dart';
import 'motion_tokens.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N6 — PulseRing + GlowPulse                                    ║
/// ║  مؤشرات حية: حلقة تتمدد وتتلاشى (GPS/سائق متاح) وتوهّج يتنفّس.  ║
/// ╚══════════════════════════════════════════════════════════════╝

/// حلقة نابضة تتمدد وتتلاشى حول نقطة مركزية.
class PulseRing extends StatefulWidget {
  const PulseRing({
    super.key,
    required this.color,
    this.size = 16,
    this.maxScale = 3.2,
    this.child,
  });

  final Color color;
  final double size;
  final double maxScale;
  final Widget? child;

  @override
  State<PulseRing> createState() => _PulseRingState();
}

class _PulseRingState extends State<PulseRing>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: Motion.pulse)..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final extent = widget.size * widget.maxScale;
    return SizedBox(
      width: extent,
      height: extent,
      child: Stack(
        alignment: Alignment.center,
        children: [
          AnimatedBuilder(
            animation: _c,
            builder: (context, child) {
              final t = _c.value;
              final d = widget.size * (1 + (widget.maxScale - 1) * t);
              return Container(
                width: d,
                height: d,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: widget.color.withValues(alpha: (1 - t) * 0.35),
                ),
              );
            },
          ),
          widget.child ??
              Container(
                width: widget.size,
                height: widget.size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: widget.color,
                ),
              ),
        ],
      ),
    );
  }
}

/// توهّج "يتنفّس" حول child (splash / أزرار نشطة).
class GlowPulse extends StatefulWidget {
  const GlowPulse({
    super.key,
    required this.child,
    required this.color,
    this.minBlur = 8,
    this.maxBlur = 28,
  });

  final Widget child;
  final Color color;
  final double minBlur;
  final double maxBlur;

  @override
  State<GlowPulse> createState() => _GlowPulseState();
}

class _GlowPulseState extends State<GlowPulse>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: Motion.pulse)
        ..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (_, child) {
        final blur =
            widget.minBlur + (widget.maxBlur - widget.minBlur) * _c.value;
        return DecoratedBox(
          decoration: BoxDecoration(
            boxShadow: [
              BoxShadow(
                color: widget.color.withValues(alpha: 0.5),
                blurRadius: blur,
                spreadRadius: blur * 0.08,
              ),
            ],
          ),
          child: child,
        );
      },
      child: widget.child,
    );
  }
}
