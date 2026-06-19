import 'dart:convert';
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

  // ── تفضيل المظهر (system/light/dark) ────────────────────────────────────────
  static const _keyAppearance = 'hancr_appearance';
  static Future<void> saveAppearance(String mode) =>
      _storage.write(key: _keyAppearance, value: mode);
  static Future<String?> getAppearance() => _storage.read(key: _keyAppearance);

  // ── تفضيل البيومترية (محلي على الجهاز) ──────────────────────────────────────
  static const _keyBiometric = 'hancr_biometric';
  static Future<void> saveBiometric(bool on) =>
      _storage.write(key: _keyBiometric, value: on ? '1' : '0');
  static Future<bool> getBiometric() async =>
      (await _storage.read(key: _keyBiometric)) == '1';

  // ── الفريق المختار (تجميلي، محلي) ───────────────────────────────────────────
  static const _keyTeam = 'hancr_team';
  static Future<void> saveTeam(String code) =>
      _storage.write(key: _keyTeam, value: code);
  static Future<String?> getTeam() => _storage.read(key: _keyTeam);

  // ── N5 — Live SDUI theme cache ──────────────────────────────────────────────
  // يُخزَّن آخر themeConfig (JSON string) ليُطبَّق فوراً عند الإقلاع قبل وصول الشبكة.
  static const _keyTheme = 'hancr_theme_config';
  static Future<void> saveThemeConfig(String json) =>
      _storage.write(key: _keyTheme, value: json);
  static Future<String?> getThemeConfig() => _storage.read(key: _keyTheme);

  // ── الحسابات المتعددة (تبديل الحساب) ────────────────────────────────────────
  // قائمة الحسابات المحفوظة [{token, riderId, phone, name}] — تبقى بعد تسجيل
  // الخروج ليتمكّن المستخدم من التبديل بينها دون إعادة دخول كامل.
  static const _keyAccounts = 'hancr_accounts';

  static Future<List<Map<String, dynamic>>> getAccounts() async {
    final raw = await _storage.read(key: _keyAccounts);
    if (raw == null || raw.isEmpty) return [];
    try {
      return (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  /// يضيف/يحدّث حساباً (مفتاح التفرّد = riderId)
  static Future<void> saveAccount({
    required String token,
    required int riderId,
    required String phone,
    String? name,
  }) async {
    final list = await getAccounts();
    list.removeWhere((a) => a['riderId'] == riderId);
    list.insert(0, {
      'token': token,
      'riderId': riderId,
      'phone': phone,
      'name': name,
    });
    await _storage.write(key: _keyAccounts, value: jsonEncode(list));
  }

  static Future<void> removeAccount(int riderId) async {
    final list = await getAccounts();
    list.removeWhere((a) => a['riderId'] == riderId);
    await _storage.write(key: _keyAccounts, value: jsonEncode(list));
  }

  /// يجعل حساباً محفوظاً هو النشط (يبدّل التوكن/المعرّف/الهاتف)
  static Future<bool> activateAccount(int riderId) async {
    final list = await getAccounts();
    final matches = list.where((a) => a['riderId'] == riderId);
    if (matches.isEmpty) return false;
    final acc = matches.first;
    await saveToken(acc['token'] as String);
    await saveRiderId(riderId);
    await savePhone(acc['phone'] as String? ?? '');
    return true;
  }

  // ── Clear All ─────────────────────────────────────────────────────────────
  // ملاحظة: لا يمسح ثيم الـ SDUI (مفتاح عام) ولا قائمة الحسابات المحفوظة
  // (ليتمكّن المستخدم من التبديل/العودة لحساب آخر بعد الخروج).
  static Future<void> clearAll() async {
    final theme = await _storage.read(key: _keyTheme);
    final accounts = await _storage.read(key: _keyAccounts);
    final appearance = await _storage.read(key: _keyAppearance);
    await _storage.deleteAll();
    if (theme != null) await _storage.write(key: _keyTheme, value: theme);
    if (accounts != null) {
      await _storage.write(key: _keyAccounts, value: accounts);
    }
    if (appearance != null) {
      await _storage.write(key: _keyAppearance, value: appearance);
    }
  }
}
