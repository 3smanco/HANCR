import 'package:flutter/widgets.dart';
import 'motion_tokens.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  ParallaxHeader — رأس بتأثير عمق عند التمرير                  ║
/// ║                                                               ║
/// ║  مرّر [scrollController] (نفس قائمة التمرير). يتحرك المحتوى    ║
/// ║  أبطأ من التمرير → إحساس عمق سينمائي. يحترم reduce-motion.     ║
/// ║  ضعه خلف المحتوى (Stack) أو كرأس Sliver مخصص.                  ║
/// ╚══════════════════════════════════════════════════════════════╝
class ParallaxHeader extends StatelessWidget {
  const ParallaxHeader({
    super.key,
    required this.scrollable,
    required this.child,
    this.factor = 0.4,
    this.maxOffset = 80,
  });

  /// الـ ScrollController أو أي Listenable يحمل offset عبر [resolve].
  final ScrollController scrollable;
  final Widget child;
  final double factor;
  final double maxOffset;

  @override
  Widget build(BuildContext context) {
    if (Motion.reduceMotion) return child;
    return AnimatedBuilder(
      animation: scrollable,
      builder: (_, c) {
        double off = 0;
        if (scrollable.hasClients) {
          off = (scrollable.offset * factor).clamp(0, maxOffset);
        }
        return Transform.translate(offset: Offset(0, -off), child: c);
      },
      child: child,
    );
  }
}
