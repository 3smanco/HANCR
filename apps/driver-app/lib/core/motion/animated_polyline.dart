import 'package:flutter/scheduler.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'motion_tokens.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  PolylineReveal — رسم المسار تدريجياً على الخريطة             ║
/// ║                                                               ║
/// ║  مرّر نقاط المسار الكاملة؛ يستدعي [onUpdate] بقائمة متنامية    ║
/// ║  من النقاط حتى يكتمل الخط (تأثير «رسم» سينمائي). يحترم          ║
/// ║  reduce-motion (يعرض الخط كاملاً فوراً).                       ║
/// ╚══════════════════════════════════════════════════════════════╝
class PolylineReveal {
  Ticker? _ticker;

  void reveal(
    List<LatLng> full, {
    required TickerProvider vsync,
    required void Function(List<LatLng> partial) onUpdate,
    Duration duration = const Duration(milliseconds: 900),
    VoidCallback? onDone,
  }) {
    _ticker?.dispose();
    if (full.length < 2 || Motion.reduceMotion) {
      onUpdate(full);
      onDone?.call();
      return;
    }
    final start = DateTime.now();
    _ticker = vsync.createTicker((_) {
      final t = (DateTime.now().difference(start).inMilliseconds /
              duration.inMilliseconds)
          .clamp(0.0, 1.0);
      final n = (full.length * t).ceil().clamp(2, full.length);
      onUpdate(full.sublist(0, n));
      if (t >= 1.0) {
        _ticker?.stop();
        _ticker?.dispose();
        _ticker = null;
        onDone?.call();
      }
    })
      ..start();
  }

  void dispose() {
    _ticker?.dispose();
    _ticker = null;
  }
}
