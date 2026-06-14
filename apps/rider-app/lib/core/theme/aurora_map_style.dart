/// ╔══════════════════════════════════════════════════════════════╗
/// ║  Aurora Map Style — نمط خريطة داكن موحّد عبر كل شاشات الخريطة  ║
/// ║                                                               ║
/// ║  غنيّ بالتفاصيل: شوارع وأسماؤها + طرق سريعة + مياه + حدائق +    ║
/// ║  معالم + حدود إدارية (مناطق) + أسماء المدن والأحياء.           ║
/// ║  مصدر واحد للحقيقة — استخدمه في كل `GoogleMap(style: …)`.       ║
/// ╚══════════════════════════════════════════════════════════════╝
class AuroraMapStyle {
  AuroraMapStyle._();

  static const String dark = '''
[
  {"elementType":"geometry","stylers":[{"color":"#13100E"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#C9BDB6"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#0A0807"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#332C28"}]},
  {"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#B9ADA6"}]},
  {"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#3D352F"}]},
  {"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#4A4039"}]},
  {"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#E0CFC2"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#16243A"}]},
  {"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#7FA0C8"}]},
  {"featureType":"poi","elementType":"geometry","stylers":[{"color":"#1B2A1C"}]},
  {"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#9DB39B"}]},
  {"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#16301A"}]},
  {"featureType":"transit","elementType":"labels.text.fill","stylers":[{"color":"#B0A8C0"}]},
  {"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#5A4F47"}]},
  {"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#F0DECF"}]},
  {"featureType":"administrative.neighborhood","elementType":"labels.text.fill","stylers":[{"color":"#C2B3A6"}]}
]
''';
}
