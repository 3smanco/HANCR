import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'motion_tokens.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N6 — Page Transitions                                         ║
/// ║  انتقالات صفحات قابلة لإعادة الاستخدام لـ go_router.           ║
/// ║  استخدمها في GoRoute عبر pageBuilder بدل builder.              ║
/// ╚══════════════════════════════════════════════════════════════╝
class AppTransitions {
  AppTransitions._();

  /// تلاشٍ ناعم (افتراضي).
  static CustomTransitionPage<T> fade<T>(Widget child, {LocalKey? key}) {
    return CustomTransitionPage<T>(
      key: key,
      transitionDuration: Motion.base,
      reverseTransitionDuration: Motion.fast,
      child: child,
      transitionsBuilder: (context, a, secondary, c) => FadeTransition(
        opacity: CurvedAnimation(parent: a, curve: Motion.standard),
        child: c,
      ),
    );
  }

  /// انزلاق من الأسفل (modals/sheets كصفحات).
  static CustomTransitionPage<T> slideUp<T>(Widget child, {LocalKey? key}) {
    return CustomTransitionPage<T>(
      key: key,
      transitionDuration: Motion.sheet,
      reverseTransitionDuration: Motion.base,
      child: child,
      transitionsBuilder: (context, a, secondary, c) {
        final slide = Tween<Offset>(
          begin: const Offset(0, 0.06),
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: a, curve: Motion.emphasized));
        return FadeTransition(
          opacity: a,
          child: SlideTransition(position: slide, child: c),
        );
      },
    );
  }

  /// محور مشترك أفقي (تنقّل أمامي/خلفي).
  static CustomTransitionPage<T> sharedAxis<T>(Widget child, {LocalKey? key}) {
    return CustomTransitionPage<T>(
      key: key,
      transitionDuration: Motion.base,
      child: child,
      transitionsBuilder: (context, a, secondary, c) {
        final inOff = Tween<Offset>(
          begin: const Offset(0.2, 0),
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: a, curve: Motion.emphasized));
        return FadeTransition(
          opacity: a,
          child: SlideTransition(position: inOff, child: c),
        );
      },
    );
  }
}
