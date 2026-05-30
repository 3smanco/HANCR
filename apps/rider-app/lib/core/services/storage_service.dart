import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Manages secure local storage for JWT and user preferences
class StorageService {
  StorageService._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _keyToken = 'hancr_access_token';
  static const _keyRiderId = 'hancr_rider_id';
  static const _keyPhone = 'hancr_phone';

  // ── Token ─────────────────────────────────────────────────────────────────
  static Future<void> saveToken(String token) =>
      _storage.write(key: _keyToken, value: token);

  static Future<String?> getToken() => _storage.read(key: _keyToken);

  static Future<bool> hasToken() async {
    final token = await _storage.read(key: _keyToken);
    return token != null && token.isNotEmpty;
  }

  static Future<void> deleteToken() => _storage.delete(key: _keyToken);

  // ── Rider ─────────────────────────────────────────────────────────────────
  static Future<void> saveRiderId(int id) =>
      _storage.write(key: _keyRiderId, value: id.toString());

  static Future<int?> getRiderId() async {
    final val = await _storage.read(key: _keyRiderId);
    return val != null ? int.tryParse(val) : null;
  }

  static Future<void> savePhone(String phone) =>
      _storage.write(key: _keyPhone, value: phone);

  static Future<String?> getPhone() => _storage.read(key: _keyPhone);

  // ── اللغة المختارة ──────────────────────────────────────────────────────────
  static const _keyLang = 'hancr_lang';
  static Future<void> saveLanguage(String code) =>
      _storage.write(key: _keyLang, value: code);
  static Future<String?> getLanguage() => _storage.read(key: _keyLang);

  // ── Clear All ─────────────────────────────────────────────────────────────
  static Future<void> clearAll() => _storage.deleteAll();
}
