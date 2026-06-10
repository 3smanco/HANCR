import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../core/motion/motion.dart';
import '../../core/theme/aurora_theme.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N8 — DriverCarMap                                            ║
/// ║  خريطة السائق مع علامة سيارة تتحرك بسلاسة (interpolation) بين  ║
/// ║  تحديثات الـ GPS وتدور مع الاتجاه (heading). أيقونة السيارة    ║
/// ║  تُرسَم برمجياً (بلا أصل خارجي).                                ║
/// ╚══════════════════════════════════════════════════════════════╝
class DriverCarMap extends StatefulWidget {
  const DriverCarMap({
    super.key,
    required this.lat,
    required this.lng,
    required this.heading,
    required this.style,
    this.showCar = true,
  });

  final double lat;
  final double lng;
  final double heading;
  final String style;
  final bool showCar;

  @override
  State<DriverCarMap> createState() => _DriverCarMapState();
}

class _DriverCarMapState extends State<DriverCarMap>
    with SingleTickerProviderStateMixin {
  GoogleMapController? _ctrl;
  BitmapDescriptor? _carIcon;

  late final AnimationController _anim;
  late LatLng _from;
  late LatLng _to;
  late double _fromHeading;
  late double _toHeading;

  @override
  void initState() {
    super.initState();
    _from = _to = LatLng(widget.lat, widget.lng);
    _fromHeading = _toHeading = widget.heading;
    _anim = AnimationController(vsync: this, duration: Motion.driverMove)
      ..addListener(() => setState(() {}));
    _loadCarIcon();
  }

  Future<void> _loadCarIcon() async {
    final icon = await _buildCarBitmap(
      bg: AuroraColors.obsidian,
      fg: AuroraColors.ember,
    );
    if (mounted) setState(() => _carIcon = icon);
  }

  @override
  void didUpdateWidget(covariant DriverCarMap old) {
    super.didUpdateWidget(old);
    if (old.lat != widget.lat ||
        old.lng != widget.lng ||
        old.heading != widget.heading) {
      // ابدأ من الموضع المعروض حالياً نحو الهدف الجديد (حركة سلسة)
      _from = _currentLatLng();
      _to = LatLng(widget.lat, widget.lng);
      _fromHeading = _currentHeading();
      _toHeading = widget.heading;
      _anim.forward(from: 0);
      _ctrl?.animateCamera(CameraUpdate.newLatLng(_to));
    }
  }

  LatLng _currentLatLng() {
    final t = _anim.value;
    return LatLng(
      _from.latitude + (_to.latitude - _from.latitude) * t,
      _from.longitude + (_to.longitude - _from.longitude) * t,
    );
  }

  double _currentHeading() {
    var diff = (_toHeading - _fromHeading) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return _fromHeading + diff * _anim.value;
  }

  @override
  void dispose() {
    _anim.dispose();
    _ctrl?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pos = _currentLatLng();
    final markers = <Marker>{};
    if (widget.showCar && _carIcon != null) {
      markers.add(Marker(
        markerId: const MarkerId('me'),
        position: pos,
        icon: _carIcon!,
        rotation: _currentHeading(),
        anchor: const Offset(0.5, 0.5),
        flat: true,
        zIndexInt: 2,
      ));
    }
    return GoogleMap(
      style: widget.style,
      initialCameraPosition: CameraPosition(target: pos, zoom: 15.5),
      onMapCreated: (c) => _ctrl = c,
      markers: markers,
      myLocationEnabled: false,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      compassEnabled: false,
    );
  }

  /// يرسم أيقونة سيارة (سهم اتجاه داخل دائرة) إلى BitmapDescriptor.
  static Future<BitmapDescriptor> _buildCarBitmap({
    required Color bg,
    required Color fg,
    double size = 110,
  }) async {
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    final r = size / 2;

    canvas.drawCircle(Offset(r, r), r, Paint()..color = bg);
    canvas.drawCircle(
      Offset(r, r),
      r - 4,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 5
        ..color = fg,
    );

    final glyph = Icons.navigation_rounded;
    final tp = TextPainter(textDirection: TextDirection.ltr)
      ..text = TextSpan(
        text: String.fromCharCode(glyph.codePoint),
        style: TextStyle(
          fontSize: size * 0.5,
          fontFamily: glyph.fontFamily,
          package: glyph.fontPackage,
          color: fg,
        ),
      )
      ..layout();
    tp.paint(canvas, Offset(r - tp.width / 2, r - tp.height / 2));

    final image =
        await recorder.endRecording().toImage(size.toInt(), size.toInt());
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    return BitmapDescriptor.bytes(bytes!.buffer.asUint8List());
  }
}
