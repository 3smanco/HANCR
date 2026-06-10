import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  StorageService._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  static const _tokenKey = 'driver_token';
  static const _driverIdKey = 'driver_id';
  static const _phoneKey = 'driver_phone';

  static Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  static Future<String?> getToken() => _storage.read(key: _tokenKey);

  static Future<bool> hasToken() async {
    final t = await _storage.read(key: _tokenKey);
    return t != null && t.isNotEmpty;
  }

  static Future<void> saveDriverId(int id) =>
      _storage.write(key: _driverIdKey, value: id.toString());

  static Future<int?> getDriverId() async {
    final v = await _storage.read(key: _driverIdKey);
    return v != null ? int.tryParse(v) : null;
  }

  static Future<void> savePhone(String phone) =>
      _storage.write(key: _phoneKey, value: phone);

  static Future<String?> getPhone() => _storage.read(key: _phoneKey);

  // ── اللغة المختارة ──
  static const _langKey = 'hancr_driver_lang';
  static Future<void> saveLanguage(String code) =>
      _storage.write(key: _langKey, value: code);
  static Future<String?> getLanguage() => _storage.read(key: _langKey);

  // ── N5 — Live SDUI theme cache ──
  // يُخزَّن آخر themeConfig (JSON) ليُطبَّق فوراً عند الإقلاع قبل وصول الشبكة.
  static const _themeKey = 'hancr_driver_theme_config';
  static Future<void> saveThemeConfig(String json) =>
      _storage.write(key: _themeKey, value: json);
  static Future<String?> getThemeConfig() => _storage.read(key: _themeKey);

  // لا يمسح ثيم الـ SDUI (مفتاح عام) ليبقى الثيم المنشور بعد تسجيل الخروج.
  static Future<void> clearAll() async {
    final theme = await _storage.read(key: _themeKey);
    await _storage.deleteAll();
    if (theme != null) await _storage.write(key: _themeKey, value: theme);
  }
}
