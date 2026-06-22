import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:google_maps_flutter/google_maps_flutter.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  CarMarkerFactory — أيقونة سيارة top-down للخريطة (رندر 3D)   ║
/// ║                                                               ║
/// ║  تحمّل رندر السيارة من الأعلى (assets/images/cars/            ║
/// ║  car_top_down.png) كـ BitmapDescriptor، تُولَّد مرة وتُخزَّن.   ║
/// ║  المقدّمة للأعلى ⇒ rotation=0 يعني شمالاً. الدوران عبر          ║
/// ║  Marker.rotation. يوحّد علامة السائق في تطبيقي الراكب والسائق. ║
/// ╚══════════════════════════════════════════════════════════════╝
class CarMarkerFactory {
  CarMarkerFactory._();

  static const _asset = 'assets/images/cars/car_top_down.png';
  static final Map<int, BitmapDescriptor> _cache = {};

  /// يُعيد أيقونة السيارة top-down للخريطة من الرندر.
  /// [px] ارتفاع الأيقونة بالبيكسل المنطقي (العرض يُحسب بنسبة الصورة).
  /// [color] محفوظ للتوافق ويُتجاهل (الرندر أبيض ثابت).
  static Future<BitmapDescriptor> car({
    Color? color,
    double px = 78,
    double dpr = 1,
  }) async {
    final key = Object.hash(px.round(), dpr.round());
    final cached = _cache[key];
    if (cached != null) return cached;

    final data = await rootBundle.load(_asset);
    final codec = await ui.instantiateImageCodec(
      data.buffer.asUint8List(),
      targetHeight: (px * dpr).round(),
    );
    final frame = await codec.getNextFrame();
    final bytes = await frame.image.toByteData(format: ui.ImageByteFormat.png);
    final desc = BitmapDescriptor.bytes(
      bytes!.buffer.asUint8List(),
      imagePixelRatio: dpr,
    );
    _cache[key] = desc;
    return desc;
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
