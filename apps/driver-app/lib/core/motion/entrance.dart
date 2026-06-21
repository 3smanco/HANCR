import 'package:flutter/widgets.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'motion_tokens.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N6 — Entrance helpers (فوق flutter_animate)                  ║
/// ║  اختصارات دخول موحّدة. [index] للـ stagger في القوائم.        ║
/// ║  مثال:  ServiceCard(...).fadeSlideIn(index: i)                ║
/// ╚══════════════════════════════════════════════════════════════╝
extension AuroraEntrance on Widget {
  /// تلاشٍ + انزلاق من الأسفل. يحترم reduce-motion (يعرض الطفل فوراً).
  Widget fadeSlideIn({int index = 0, double dy = 18, Duration? duration}) {
    if (Motion.reduceMotion) return this;
    final d = duration ?? Motion.base;
    return animate(delay: Duration(milliseconds: 60 * index))
        .fadeIn(duration: d, curve: Motion.decelerate)
        .slideY(begin: dy / 100, end: 0, duration: d, curve: Motion.emphasized);
  }

  /// تلاشٍ + تكبير مع overshoot (بطاقات/أيقونات). يحترم reduce-motion.
  Widget popIn({int index = 0, Duration? duration}) {
    if (Motion.reduceMotion) return this;
    final d = duration ?? Motion.base;
    return animate(delay: Duration(milliseconds: 50 * index))
        .fadeIn(duration: d)
        .scaleXY(begin: 0.92, end: 1, duration: d, curve: Motion.overshoot);
  }

  /// تلاشٍ + انزلاق من اليمين (RTL-friendly للقوائم الجانبية). يحترم reduce-motion.
  Widget fadeInRight({int index = 0, double dx = 16, Duration? duration}) {
    if (Motion.reduceMotion) return this;
    final d = duration ?? Motion.base;
    return animate(delay: Duration(milliseconds: 60 * index))
        .fadeIn(duration: d, curve: Motion.decelerate)
        .slideX(begin: dx / 100, end: 0, duration: d, curve: Motion.emphasized);
  }
}
