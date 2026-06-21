import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  CarMarkerFactory — أيقونة سيارة top-down للخريطة (بلا أصول)  ║
/// ║                                                               ║
/// ║  ترسم سيارة من الأعلى (BitmapDescriptor) بلون الهوية. تُولَّد  ║
/// ║  مرة وتُخزَّن. الدوران يتم عبر Marker.rotation (أرخص من إعادة  ║
/// ║  الرسم). يوحّد علامة السائق في تطبيقي الراكب والسائق.          ║
/// ╚══════════════════════════════════════════════════════════════╝
class CarMarkerFactory {
  CarMarkerFactory._();

  static final Map<int, BitmapDescriptor> _cache = {};

  /// يُعيد أيقونة السيارة (top-down). [color] لون الجسم، [px] الحجم.
  static Future<BitmapDescriptor> car({
    required Color color,
    double px = 120,
    double dpr = 1,
  }) async {
    final key = Object.hash(color.toARGB32(), px.round(), dpr.round());
    final cached = _cache[key];
    if (cached != null) return cached;

    final size = px * dpr;
    final rec = ui.PictureRecorder();
    final canvas = Canvas(rec);
    _paintTopDown(canvas, Size(size, size), color);
    final img = await rec.endRecording().toImage(size.round(), size.round());
    final bytes = await img.toByteData(format: ui.ImageByteFormat.png);
    final desc = BitmapDescriptor.bytes(
      bytes!.buffer.asUint8List(),
      imagePixelRatio: dpr,
    );
    _cache[key] = desc;
    return desc;
  }

  /// يرسم سيارة من الأعلى: المقدّمة تتجه لأعلى (rotation=0 ⇒ شمالاً).
  static void _paintTopDown(Canvas c, Size s, Color color) {
    final w = s.width;
    final h = s.height;
    // ظل ناعم تحت السيارة
    final shadow = Paint()
      ..color = Colors.black.withValues(alpha: 0.28)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
    c.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.30, h * 0.20, w * 0.40, h * 0.66),
        Radius.circular(w * 0.16),
      ),
      shadow,
    );

    // جسم السيارة
    final body = Paint()..color = color;
    final rect = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.30, h * 0.16, w * 0.40, h * 0.66),
      Radius.circular(w * 0.16),
    );
    c.drawRRect(rect, body);

    // زجاج أمامي/خلفي (داكن)
    final glass = Paint()..color = const Color(0xFF0A0807).withValues(alpha: 0.7);
    c.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.34, h * 0.22, w * 0.32, h * 0.16),
        Radius.circular(w * 0.06),
      ),
      glass,
    );
    c.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.34, h * 0.58, w * 0.32, h * 0.16),
        Radius.circular(w * 0.06),
      ),
      glass,
    );
    // سقف فاتح بين الزجاجين
    final roof = Paint()..color = color.withValues(alpha: 0.85);
    c.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.34, h * 0.40, w * 0.32, h * 0.16),
        Radius.circular(w * 0.04),
      ),
      roof,
    );
    // مصابيح أمامية (أعلى)
    final light = Paint()..color = Colors.white.withValues(alpha: 0.9);
    c.drawCircle(Offset(w * 0.37, h * 0.19), w * 0.025, light);
    c.drawCircle(Offset(w * 0.63, h * 0.19), w * 0.025, light);
  }

  static void clearCache() => _cache.clear();
}

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  MarkerInterpolator — انسياب موضع + اتجاه السيارة             ║
/// ║                                                               ║
/// ║  يخزّن آخر موضع/زاوية ويولّد خطوات وسيطة (LatLng + bearing)    ║
/// ║  لتتحرك السيارة بنعومة بدل القفز. استدعِ [to] عند كل تحديث     ║
/// ║  GPS ومرّر [onStep] لتحديث الـ Marker.                         ║
/// ╚══════════════════════════════════════════════════════════════╝
class MarkerInterpolator {
  LatLng? _current;
  double _bearing = 0;
  Ticker? _ticker;

  LatLng? get current => _current;
  double get bearing => _bearing;

  /// زاوية الاتجاه بين نقطتين (درجات، 0=شمال).
  static double bearingBetween(LatLng a, LatLng b) {
    final lat1 = a.latitude * math.pi / 180;
    final lat2 = b.latitude * math.pi / 180;
    final dLon = (b.longitude - a.longitude) * math.pi / 180;
    final y = math.sin(dLon) * math.cos(lat2);
    final x = math.cos(lat1) * math.sin(lat2) -
        math.sin(lat1) * math.cos(lat2) * math.cos(dLon);
    final deg = math.atan2(y, x) * 180 / math.pi;
    return (deg + 360) % 360;
  }

  static LatLng _lerp(LatLng a, LatLng b, double t) => LatLng(
        a.latitude + (b.latitude - a.latitude) * t,
        a.longitude + (b.longitude - a.longitude) * t,
      );

  /// يحرّك من الموضع الحالي إلى [target] عبر [vsync] خلال [duration].
  void to(
    LatLng target, {
    required TickerProvider vsync,
    required void Function(LatLng pos, double bearing) onStep,
    Duration duration = const Duration(milliseconds: 800),
  }) {
    final from = _current;
    if (from == null) {
      _current = target;
      onStep(target, _bearing);
      return;
    }
    final targetBearing = bearingBetween(from, target);
    final fromBearing = _bearing;
    _ticker?.dispose();
    final start = DateTime.now();
    _ticker = vsync.createTicker((_) {
      final t = (DateTime.now().difference(start).inMilliseconds /
              duration.inMilliseconds)
          .clamp(0.0, 1.0);
      final pos = _lerp(from, target, t);
      final br = fromBearing + _shortestTurn(fromBearing, targetBearing) * t;
      _current = pos;
      _bearing = br % 360;
      onStep(pos, _bearing);
      if (t >= 1.0) {
        _ticker?.stop();
        _ticker?.dispose();
        _ticker = null;
        _current = target;
        _bearing = targetBearing;
      }
    })
      ..start();
  }

  static double _shortestTurn(double from, double to) {
    var diff = (to - from) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return diff;
  }

  void dispose() {
    _ticker?.dispose();
    _ticker = null;
  }
}

/// أداة مساعدة لتوليد بايتات أيقونة عامة (نقطة نابضة) إن لزم.
Future<Uint8List> circlePng(Color color, double px) async {
  final rec = ui.PictureRecorder();
  final c = Canvas(rec);
  c.drawCircle(Offset(px / 2, px / 2), px / 2, Paint()..color = color);
  final img = await rec.endRecording().toImage(px.round(), px.round());
  final bytes = await img.toByteData(format: ui.ImageByteFormat.png);
  return bytes!.buffer.asUint8List();
}
