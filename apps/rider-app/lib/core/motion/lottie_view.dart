import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N6 — LottieView                                              ║
/// ║  مشغّل Lottie من assets/anim/. لو الأصل غير موجود يعرض         ║
/// ║  [fallback] بدل الانهيار (الأصول الفعلية تُضاف في N7/N8).      ║
/// ╚══════════════════════════════════════════════════════════════╝
class LottieView extends StatelessWidget {
  const LottieView(
    this.asset, {
    super.key,
    this.width,
    this.height,
    this.repeat = true,
    this.controller,
    this.onLoaded,
    this.fit = BoxFit.contain,
    this.fallback,
  });

  /// اسم الملف داخل assets/anim/ (بدون مسار) أو مسار كامل.
  final String asset;
  final double? width;
  final double? height;
  final bool repeat;
  final AnimationController? controller;
  final void Function(LottieComposition)? onLoaded;
  final BoxFit fit;
  final Widget? fallback;

  String get _path => asset.contains('/') ? asset : 'assets/anim/$asset';

  @override
  Widget build(BuildContext context) {
    return Lottie.asset(
      _path,
      width: width,
      height: height,
      repeat: repeat,
      controller: controller,
      onLoaded: onLoaded,
      fit: fit,
      errorBuilder: (context, error, stack) =>
          fallback ?? SizedBox(width: width, height: height),
    );
  }
}
