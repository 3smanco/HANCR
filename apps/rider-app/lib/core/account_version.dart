import 'package:package_info_plus/package_info_plus.dart';
import 'i18n/app_localization.dart';

/// رقم إصدار التطبيق الديناميكي (يُقرأ من حزمة التطبيق).
class AccountVersion {
  AccountVersion._();

  static String? _cached;

  /// "v1.2.3 (45)" — يُحسب مرّة ويُخزَّن.
  static Future<String> raw() async {
    if (_cached != null) return _cached!;
    try {
      final info = await PackageInfo.fromPlatform();
      _cached = 'v${info.version} (${info.buildNumber})';
    } catch (_) {
      _cached = '';
    }
    return _cached!;
  }

  /// "الإصدار v1.2.3 (45)" — للتذييل.
  static Future<String> label() async {
    final v = await raw();
    if (v.isEmpty) return '';
    return '${tr('version')} $v';
  }
}
