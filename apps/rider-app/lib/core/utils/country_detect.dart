import 'dart:ui';

/// كشف رمز الاتصال الدولي من الإحداثيات أو من إعداد منطقة الجهاز.
///
/// يُستخدم عند تسجيل الدخول ليظهر رمز الدولة الفعلية للمستخدم بدل قيمة ثابتة.
/// لا يحتاج أي حزمة جديدة — يعتمد على إحداثيات geolocator + locale الجهاز.

class _Box {
  final double minLat, maxLat, minLng, maxLng;
  final String dial;
  const _Box(this.minLat, this.maxLat, this.minLng, this.maxLng, this.dial);
  bool has(double lat, double lng) =>
      lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/// صناديق حدودية مرتّبة من الأصغر/الأدق إلى الأوسع (قطر قبل السعودية الكبيرة).
const List<_Box> _boxes = [
  _Box(24.4, 26.2, 50.5, 51.7, '+974'), // Qatar
  _Box(25.5, 30.1, 46.5, 48.8, '+965'), // Kuwait
  _Box(25.7, 26.4, 50.3, 50.9, '+973'), // Bahrain
  _Box(22.5, 26.5, 51.0, 56.5, '+971'), // UAE
  _Box(16.0, 26.5, 52.0, 59.9, '+968'), // Oman
  _Box(22.0, 32.2, 24.7, 36.9, '+20'), // Egypt
  _Box(16.0, 32.3, 34.4, 55.7, '+966'), // Saudi Arabia (الأوسع)
];

/// خريطة رمز منطقة الجهاز (ISO) → رمز الاتصال.
const Map<String, String> _localeToDial = {
  'QA': '+974',
  'AE': '+971',
  'SA': '+966',
  'KW': '+965',
  'BH': '+973',
  'OM': '+968',
  'EG': '+20',
};

/// يُرجع رمز الاتصال من الإحداثيات (صناديق حدودية)، أو null إن لم تطابق.
String? dialCodeFromCoords(double lat, double lng) {
  for (final b in _boxes) {
    if (b.has(lat, lng)) return b.dial;
  }
  return null;
}

/// رمز الاتصال من إعداد منطقة الجهاز (احتياط)، أو null.
String? dialCodeFromLocale() {
  final region = PlatformDispatcher.instance.locale.countryCode?.toUpperCase();
  if (region == null) return null;
  return _localeToDial[region];
}
