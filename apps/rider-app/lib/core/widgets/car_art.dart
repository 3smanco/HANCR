import 'package:flutter/material.dart';

/// أنواع المركبات (تطابق فئات الخدمة).
enum CarType { sedan, suv, bike, van, luxury }

/// CarArt — يعرض رندر 3D احترافي للمركبة داخل بطاقة فاتحة أنيقة.
///
/// الرندرات (Figma) لها خلفية فاتحة مدمجة، لذا تُعرض داخل "بطاقة"
/// فاتحة مستديرة (مثل أوبر) تبدو راقية فوق بطاقات Aurora الداكنة.
/// الواجهة ثابتة: [type]، [size]. [color] محفوظ للتوافق (يُتجاهل
/// للرندرات الضوئية). [radius] لزوايا البطاقة، [background] للون البطاقة.
class CarArt extends StatelessWidget {
  const CarArt({
    super.key,
    this.type = CarType.sedan,
    this.color,
    this.size = const Size(120, 64),
    this.radius = 14,
    this.background = const Color(0xFFF1F1F2),
  });

  final CarType type;
  final Color? color;
  final Size size;
  final double radius;
  final Color background;

  static const _assets = <CarType, String>{
    CarType.sedan: 'assets/images/cars/car_sedan.png',
    CarType.suv: 'assets/images/cars/car_suv.png',
    CarType.van: 'assets/images/cars/car_van.png',
    CarType.luxury: 'assets/images/cars/car_luxury.png',
  };

  @override
  Widget build(BuildContext context) {
    final asset = _assets[type];
    final Widget inner = asset != null
        ? Image.asset(
            asset,
            width: size.width,
            height: size.height,
            fit: BoxFit.contain,
            filterQuality: FilterQuality.medium,
          )
        : CustomPaint(
            size: size,
            painter: _BikePainter(color ?? const Color(0xFF2A2421)),
          );

    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: Container(
        width: size.width,
        height: size.height,
        color: background,
        alignment: Alignment.center,
        child: inner,
      ),
    );
  }
}

// ─── Bike fallback (لا يوجد رندر دراجة من المصمّم) ────────────────────────

class _BikePainter extends CustomPainter {
  _BikePainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final body = Paint()..color = color;
    final tire = Paint()..color = const Color(0xFF15110F);
    final hub = Paint()..color = color.withValues(alpha: 0.6);

    final cy = h * 0.60;
    final r = h * 0.20;
    final lx = w * 0.28;
    final rx = w * 0.72;

    canvas.drawCircle(Offset(lx, cy), r, tire);
    canvas.drawCircle(Offset(rx, cy), r, tire);
    canvas.drawCircle(Offset(lx, cy), r * 0.45, hub);
    canvas.drawCircle(Offset(rx, cy), r * 0.45, hub);

    final frame = Paint()
      ..color = body.color
      ..style = PaintingStyle.stroke
      ..strokeWidth = h * 0.07
      ..strokeCap = StrokeCap.round;
    final path = Path()
      ..moveTo(lx, cy)
      ..lineTo(w * 0.48, cy)
      ..lineTo(w * 0.58, h * 0.38)
      ..lineTo(rx, cy)
      ..moveTo(w * 0.48, cy)
      ..lineTo(w * 0.42, h * 0.38);
    canvas.drawPath(path, frame);

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.36, h * 0.35, w * 0.12, h * 0.05),
        const Radius.circular(3),
      ),
      body,
    );
  }

  @override
  bool shouldRepaint(_BikePainter old) => old.color != color;
}
