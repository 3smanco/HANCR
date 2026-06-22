import 'package:flutter/animation.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N6 — Aurora Motion Tokens                                     ║
/// ║  مدد ومنحنيات الحركة القانونية لكل التطبيق. لا أرقام سحرية      ║
/// ║  متفرّقة — كل أنيميشن يشير لهذه القيم.                          ║
/// ╚══════════════════════════════════════════════════════════════╝
class Motion {
  Motion._();

  // ═══ Durations ═══
  static const Duration instant = Duration(milliseconds: 90);
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration button = Duration(milliseconds: 120);
  static const Duration base = Duration(milliseconds: 250);
  static const Duration skin = Duration(milliseconds: 300); // تبديل الـ skin
  static const Duration sheet = Duration(milliseconds: 380); // bottom sheets
  static const Duration slow = Duration(milliseconds: 500);
  static const Duration map = Duration(milliseconds: 500); // map zoom
  static const Duration driverMove =
      Duration(milliseconds: 800); // interpolation
  static const Duration pulse = Duration(milliseconds: 1400); // نبض حي
  static const Duration shimmer = Duration(milliseconds: 1200);

  // ═══ Curves ═══
  static const Curve standard = Curves.easeInOutCubic;
  static const Curve emphasized = Curves.fastOutSlowIn;
  static const Curve decelerate = Curves.easeOutCubic;
  static const Curve accelerate = Curves.easeInCubic;
  static const Curve spring = Curves.elasticOut;
  static const Curve overshoot = Curves.easeOutBack;

  // ═══ Scales ═══
  static const double pressScale = 0.97; // ضغط الأزرار (design token)

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  Reduce-motion gate (الوصول / كبار السن / إعداد النظام)        ║
  // ║  يُضبط في app.dart من MediaQuery.disableAnimations + الوضع     ║
  // ║  المبسّط. الحركات الثقيلة (parallax/confetti/pulse) تحترمه.    ║
  // ╚══════════════════════════════════════════════════════════════╝
  static bool reduceMotion = false;

  /// يُعيد [d] أو Duration.zero عند تفعيل تقليل الحركة (للانتقالات الفورية).
  static Duration dur(Duration d) => reduceMotion ? Duration.zero : d;

  /// هل يُسمح بالحركات الزخرفية (نبض/كونفيتي/parallax)؟
  static bool get decorative => !reduceMotion;
}
