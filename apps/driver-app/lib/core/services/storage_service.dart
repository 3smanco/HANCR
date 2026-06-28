import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  StorageService._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  // ── حماية مركزية ضد تعليق/فشل التخزين الآمن ────────────────────────────────
  // FlutterSecureStorage قد يتعلّق أو يرمي عند الإقلاع (خاصةً بعد تثبيت نظيف
  // وتغيّر مفتاح الـ Keystore). كل العمليات تمرّ بمهلة + التقاط استثناء فلا
  // يتجمّد التطبيق على شاشة البداية أبداً.
  static const _ioTimeout = Duration(seconds: 4);

  static Future<String?> _read(String key) async {
    try {
      return await _storage.read(key: key).timeout(_ioTimeout);
    } catch (_) {
      return null;
    }
  }

  static Future<void> _write(String key, String value) async {
    try {
      await _storage.write(key: key, value: value).timeout(_ioTimeout);
    } catch (_) {}
  }

  static Future<void> _deleteAll() async {
    try {
      await _storage.deleteAll().timeout(_ioTimeout);
    } catch (_) {}
  }

  static const _tokenKey = 'driver_token';
  static const _driverIdKey = 'driver_id';
  static const _phoneKey = 'driver_phone';

  static Future<void> saveToken(String token) => _write(_tokenKey, token);

  static Future<String?> getToken() => _read(_tokenKey);

  static Future<bool> hasToken() async {
    final t = await _read(_tokenKey);
    return t != null && t.isNotEmpty;
  }

  static Future<void> saveDriverId(int id) =>
      _write(_driverIdKey, id.toString());

  static Future<int?> getDriverId() async {
    final v = await _read(_driverIdKey);
    return v != null ? int.tryParse(v) : null;
  }

  static Future<void> savePhone(String phone) => _write(_phoneKey, phone);

  static Future<String?> getPhone() => _read(_phoneKey);

  // ── اللغة المختارة ──
  static const _langKey = 'hancr_driver_lang';
  static Future<void> saveLanguage(String code) => _write(_langKey, code);
  static Future<String?> getLanguage() => _read(_langKey);

  // ── N5 — Live SDUI theme cache ──
  // يُخزَّن آخر themeConfig (JSON) ليُطبَّق فوراً عند الإقلاع قبل وصول الشبكة.
  static const _themeKey = 'hancr_driver_theme_config';
  static Future<void> saveThemeConfig(String json) => _write(_themeKey, json);
  static Future<String?> getThemeConfig() => _read(_themeKey);

  // ── N10 — هدف الأرباح اليومي (محلي) ──
  static const _dailyGoalKey = 'hancr_driver_daily_goal';
  static Future<void> saveDailyGoal(double v) =>
      _write(_dailyGoalKey, v.toStringAsFixed(0));
  static Future<double?> getDailyGoal() async {
    final v = await _read(_dailyGoalKey);
    return v != null ? double.tryParse(v) : null;
  }

  // لا يمسح ثيم الـ SDUI (مفتاح عام) ليبقى الثيم المنشور بعد تسجيل الخروج.
  static Future<void> clearAll() async {
    final theme = await _read(_themeKey);
    await _deleteAll();
    if (theme != null) await _write(_themeKey, theme);
  }
}
