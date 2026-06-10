import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/aurora_theme.dart';
import 'motion_tokens.dart';
import 'haptics.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N6 — SuccessCheck                                            ║
/// ║  علامة نجاح متحركة (دائرة تنبثق + حلقة تتمدد + haptic نجاح).   ║
/// ║  للرحلة المكتملة / الدفع الناجح. بلا أصول خارجية.             ║
/// ╚══════════════════════════════════════════════════════════════╝
class SuccessCheck extends StatefulWidget {
  const SuccessCheck({
    super.key,
    this.size = 96,
    this.color,
    this.onDone,
  });

  final double size;
  final Color? color;
  final VoidCallback? onDone;

  @override
  State<SuccessCheck> createState() => _SuccessCheckState();
}

class _SuccessCheckState extends State<SuccessCheck> {
  @override
  void initState() {
    super.initState();
    Haptics.success();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.color ?? AuroraColors.success;
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // حلقة متمددة متلاشية
          Container(
            width: widget.size,
            height: widget.size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: c.withValues(alpha: 0.15),
            ),
          )
              .animate()
              .scaleXY(begin: 0.2, end: 1.4, duration: Motion.slow, curve: Motion.decelerate)
              .fadeOut(duration: Motion.slow),
          // دائرة مصمتة + علامة الصح
          Container(
            width: widget.size * 0.7,
            height: widget.size * 0.7,
            decoration: BoxDecoration(shape: BoxShape.circle, color: c),
            child: Icon(
              Icons.check_rounded,
              color: AuroraColors.obsidian,
              size: widget.size * 0.42,
            ),
          )
              .animate(onComplete: (_) => widget.onDone?.call())
              .scaleXY(begin: 0, end: 1, duration: Motion.base, curve: Motion.spring),
        ],
      ),
    );
  }
}
