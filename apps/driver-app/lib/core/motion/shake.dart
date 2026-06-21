import 'dart:math' as math;
import 'package:flutter/widgets.dart';
import 'motion_tokens.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  Shake — اهتزاز أفقي للخطأ (OTP/إدخال غير صالح)               ║
/// ║                                                               ║
/// ║  زِد [trigger] (مثلاً عدّاد محاولات فاشلة) ليهتزّ الطفل.        ║
/// ║  مثال: Shake(trigger: _failCount, child: pinField)            ║
/// ╚══════════════════════════════════════════════════════════════╝
class Shake extends StatefulWidget {
  const Shake({
    super.key,
    required this.trigger,
    required this.child,
    this.amplitude = 10,
  });

  final int trigger;
  final Widget child;
  final double amplitude;

  @override
  State<Shake> createState() => _ShakeState();
}

class _ShakeState extends State<Shake> with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 450),
    );
  }

  @override
  void didUpdateWidget(Shake old) {
    super.didUpdateWidget(old);
    if (widget.trigger != old.trigger && widget.trigger > 0) {
      if (Motion.decorative) {
        _c.forward(from: 0);
      }
    }
  }

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
        // اهتزاز متلاشٍ: sin بتردّد عالٍ × غلاف متناقص
        final dx = math.sin(_c.value * math.pi * 5) *
            widget.amplitude *
            (1 - _c.value);
        return Transform.translate(offset: Offset(dx, 0), child: child);
      },
      child: widget.child,
    );
  }
}
