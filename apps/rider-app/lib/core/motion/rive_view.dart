import 'dart:typed_data' show ByteData;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:rive/rive.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N6 — RiveView                                                ║
/// ║  مشغّل Rive من assets/anim/ مع state-machine اختياري. يتحقّق   ║
/// ║  من وجود الأصل أولاً فيعرض [fallback] بدل الانهيار (الأصول     ║
/// ║  الفعلية — مثل السيارة المتحركة — تُضاف في N8).                ║
/// ╚══════════════════════════════════════════════════════════════╝
class RiveView extends StatelessWidget {
  const RiveView(
    this.asset, {
    super.key,
    this.width,
    this.height,
    this.stateMachine,
    this.artboard,
    this.fit = BoxFit.contain,
    this.fallback,
  });

  /// اسم الملف داخل assets/anim/ (بدون مسار) أو مسار كامل.
  final String asset;
  final double? width;
  final double? height;
  final String? stateMachine;
  final String? artboard;
  final BoxFit fit;
  final Widget? fallback;

  String get _path => asset.contains('/') ? asset : 'assets/anim/$asset';

  @override
  Widget build(BuildContext context) {
    final placeholder = fallback ?? SizedBox(width: width, height: height);
    return FutureBuilder<ByteData>(
      future: rootBundle.load(_path),
      builder: (_, snap) {
        if (snap.connectionState != ConnectionState.done) return placeholder;
        if (snap.hasError || !snap.hasData) return placeholder;
        return SizedBox(
          width: width,
          height: height,
          child: RiveAnimation.asset(
            _path,
            artboard: artboard,
            fit: fit,
            stateMachines: stateMachine != null
                ? <String>[stateMachine!]
                : const <String>[],
          ),
        );
      },
    );
  }
}
