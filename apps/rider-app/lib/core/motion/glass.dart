import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/aurora_theme.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  Glass — حاوية زجاجية موحّدة (Glassmorphism)                  ║
/// ║                                                               ║
/// ║  BackdropFilter blur + تدرّج زجاجي خفيف + حدّ مضيء.            ║
/// ║  ⚠️ مكلف على الأجهزة الضعيفة: استعملها لطبقة واحدة بارزة فقط   ║
/// ║  (ورقة الحجز/بطاقة السائق)، لا في القوائم. ملفوفة بـ           ║
/// ║  RepaintBoundary تلقائياً.                                     ║
/// ╚══════════════════════════════════════════════════════════════╝
class GlassContainer extends StatelessWidget {
  const GlassContainer({
    super.key,
    required this.child,
    this.blur = 18,
    this.opacity = 0.6,
    this.radius = 24,
    this.padding,
    this.border = true,
    this.tint,
  });

  final Widget child;
  final double blur;
  final double opacity;
  final double radius;
  final EdgeInsetsGeometry? padding;
  final bool border;
  final Color? tint;

  @override
  Widget build(BuildContext context) {
    final br = BorderRadius.circular(radius);
    final base = tint ?? AuroraColors.ash;
    return RepaintBoundary(
      child: ClipRRect(
        borderRadius: br,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              borderRadius: br,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  base.withValues(alpha: opacity),
                  base.withValues(alpha: opacity * 0.8),
                ],
              ),
              border: border
                  ? Border.all(color: AuroraColors.borderStrong, width: 1)
                  : null,
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

/// ورقة سفلية زجاجية (تُستعمل كحاوية لورقة الحجز/التتبّع).
class GlassSheet extends StatelessWidget {
  const GlassSheet({
    super.key,
    required this.child,
    this.blur = 22,
    this.padding = const EdgeInsets.all(20),
  });

  final Widget child;
  final double blur;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    const r = Radius.circular(28);
    return RepaintBoundary(
      child: ClipRRect(
        borderRadius: const BorderRadius.only(topLeft: r, topRight: r),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            width: double.infinity,
            padding: padding,
            decoration: BoxDecoration(
              color: AuroraColors.coal.withValues(alpha: 0.82),
              borderRadius: const BorderRadius.only(topLeft: r, topRight: r),
              border: Border(
                top: BorderSide(color: AuroraColors.borderStrong, width: 1),
              ),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
