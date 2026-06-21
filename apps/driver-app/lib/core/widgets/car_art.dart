import 'package:flutter/material.dart';
import '../theme/aurora_theme.dart';

/// أنواع المركبات المرسومة (تطابق فئات الخدمة).
enum CarType { sedan, suv, bike, van, luxury }

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  CarArt — رسم مركبة جانبي أنيق (CustomPainter, بلا أصول)       ║
/// ║                                                               ║
/// ║  يُستعمل في بطاقات اختيار الخدمة وشاشات البطل. اللون يتبع       ║
/// ║  [color] (افتراضياً ember). قابل للاستبدال لاحقاً بأصول SVG/3D ║
/// ║  احترافية دون تغيير الواجهة (نفس الـ widget).                  ║
/// ╚══════════════════════════════════════════════════════════════╝
class CarArt extends StatelessWidget {
  const CarArt({
    super.key,
    this.type = CarType.sedan,
    this.color,
    this.size = const Size(120, 64),
  });

  final CarType type;
  final Color? color;
  final Size size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size.width,
      height: size.height,
      child: CustomPaint(
        painter: _CarPainter(type, color ?? AuroraColors.ember),
      ),
    );
  }
}

class _CarPainter extends CustomPainter {
  _CarPainter(this.type, this.color);
  final CarType type;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final body = Paint()..color = color;
    final glass = Paint()..color = AuroraColors.obsidian.withValues(alpha: 0.55);
    final tire = Paint()..color = const Color(0xFF15110F);
    final hub = Paint()..color = color.withValues(alpha: 0.9);
    final shine = Paint()..color = Colors.white.withValues(alpha: 0.18);

    switch (type) {
      case CarType.bike:
        _bike(canvas, w, h, body, tire, hub, glass);
        return;
      case CarType.van:
        _box(canvas, w, h, body, glass, tire, hub, shine, tall: true);
        return;
      case CarType.suv:
        _box(canvas, w, h, body, glass, tire, hub, shine, tall: false);
        return;
      case CarType.luxury:
        _sedan(canvas, w, h, body, glass, tire, hub, shine, low: true);
        return;
      case CarType.sedan:
        _sedan(canvas, w, h, body, glass, tire, hub, shine, low: false);
        return;
    }
  }

  void _sedan(Canvas c, double w, double h, Paint body, Paint glass, Paint tire,
      Paint hub, Paint shine,
      {required bool low}) {
    final baseY = h * 0.74;
    final roofH = low ? h * 0.30 : h * 0.36;
    final lower = RRect.fromRectAndRadius(
      Rect.fromLTRB(w * 0.04, h * 0.50, w * 0.96, baseY),
      Radius.circular(h * 0.18),
    );
    // سقف منحنٍ
    final roof = Path()
      ..moveTo(w * 0.26, h * 0.50)
      ..quadraticBezierTo(w * 0.40, h * 0.50 - roofH, w * 0.56, h * 0.50 - roofH)
      ..quadraticBezierTo(w * 0.70, h * 0.50 - roofH, w * 0.78, h * 0.50)
      ..close();
    c.drawPath(roof, body);
    c.drawRRect(lower, body);
    // زجاج
    final win = Path()
      ..moveTo(w * 0.31, h * 0.49)
      ..quadraticBezierTo(w * 0.42, h * 0.49 - roofH * 0.7, w * 0.54, h * 0.49 - roofH * 0.7)
      ..quadraticBezierTo(w * 0.66, h * 0.49 - roofH * 0.7, w * 0.72, h * 0.49)
      ..close();
    c.drawPath(win, glass);
    // لمعة
    c.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTRB(w * 0.10, h * 0.55, w * 0.90, h * 0.585),
        const Radius.circular(4),
      ),
      shine,
    );
    _wheels(c, w, h, baseY, tire, hub);
  }

  void _box(Canvas c, double w, double h, Paint body, Paint glass, Paint tire,
      Paint hub, Paint shine,
      {required bool tall}) {
    final baseY = h * 0.76;
    final topY = tall ? h * 0.16 : h * 0.24;
    final shell = RRect.fromRectAndRadius(
      Rect.fromLTRB(w * 0.06, topY, w * 0.94, baseY),
      Radius.circular(h * 0.16),
    );
    c.drawRRect(shell, body);
    // نوافذ
    c.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTRB(w * 0.30, topY + h * 0.07, w * 0.86, h * 0.46),
        Radius.circular(h * 0.06),
      ),
      glass,
    );
    c.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTRB(w * 0.10, h * 0.56, w * 0.90, h * 0.59),
        const Radius.circular(4),
      ),
      shine,
    );
    _wheels(c, w, h, baseY, tire, hub);
  }

  void _bike(Canvas c, double w, double h, Paint body, Paint tire, Paint hub,
      Paint glass) {
    final cy = h * 0.62;
    final r = h * 0.20;
    final lx = w * 0.24;
    final rx = w * 0.76;
    // إطارات
    c.drawCircle(Offset(lx, cy), r, tire);
    c.drawCircle(Offset(rx, cy), r, tire);
    c.drawCircle(Offset(lx, cy), r * 0.45, hub);
    c.drawCircle(Offset(rx, cy), r * 0.45, hub);
    // هيكل
    final frame = Paint()
      ..color = body.color
      ..style = PaintingStyle.stroke
      ..strokeWidth = h * 0.08
      ..strokeCap = StrokeCap.round;
    final path = Path()
      ..moveTo(lx, cy)
      ..lineTo(w * 0.46, cy)
      ..lineTo(w * 0.58, h * 0.40)
      ..lineTo(rx, cy)
      ..moveTo(w * 0.46, cy)
      ..lineTo(w * 0.40, h * 0.40);
    c.drawPath(path, frame);
    // مقعد/مقود
    c.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.34, h * 0.37, w * 0.12, h * 0.05),
        const Radius.circular(3),
      ),
      body,
    );
  }

  void _wheels(Canvas c, double w, double h, double baseY, Paint tire, Paint hub) {
    final r = h * 0.16;
    final lx = w * 0.27;
    final rx = w * 0.73;
    c.drawCircle(Offset(lx, baseY), r, tire);
    c.drawCircle(Offset(rx, baseY), r, tire);
    c.drawCircle(Offset(lx, baseY), r * 0.42, hub);
    c.drawCircle(Offset(rx, baseY), r * 0.42, hub);
  }

  @override
  bool shouldRepaint(_CarPainter old) =>
      old.type != type || old.color != color;
}
