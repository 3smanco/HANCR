import 'package:flutter/material.dart';
import 'motion_tokens.dart';
import 'haptics.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N6 — Pressable                                                ║
/// ║  يلفّ أي child بتأثير ضغط (scale down) + haptic عند اللمس.     ║
/// ║  الأساس لكل الأزرار/البطاقات القابلة للنقر بحركة "أقصى".        ║
/// ╚══════════════════════════════════════════════════════════════╝
class Pressable extends StatefulWidget {
  const Pressable({
    super.key,
    required this.child,
    this.onTap,
    this.onLongPress,
    this.scale = Motion.pressScale,
    this.haptic = true,
    this.enabled = true,
  });

  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final double scale;
  final bool haptic;
  final bool enabled;

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _down = false;

  void _set(bool v) {
    if (mounted) setState(() => _down = v);
  }

  bool get _active =>
      widget.enabled && (widget.onTap != null || widget.onLongPress != null);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: _active ? (_) => _set(true) : null,
      onTapUp: _active ? (_) => _set(false) : null,
      onTapCancel: _active ? () => _set(false) : null,
      onTap: _active
          ? () {
              if (widget.haptic) Haptics.light();
              widget.onTap?.call();
            }
          : null,
      onLongPress: _active && widget.onLongPress != null
          ? () {
              if (widget.haptic) Haptics.medium();
              widget.onLongPress!.call();
            }
          : null,
      child: AnimatedScale(
        scale: _down ? widget.scale : 1.0,
        duration: Motion.button,
        curve: Motion.standard,
        child: widget.child,
      ),
    );
  }
}
