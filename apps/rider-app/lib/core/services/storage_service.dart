import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Manages secure local storage for JWT and user preferences
class StorageService {
  StorageService._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  // ── حماية مركزية ضد تعليق/فشل التخزين الآمن ────────────────────────────────
  // FlutterSecureStorage (خاصةً encryptedSharedPreferences على أندرويد) قد
  // يتعلّق أو يرمي استثناءً عند الإقلاع — خصوصاً بعد إعادة تثبيت نظيفة (تغيّر
  // مفتاح الـ Keystore). كل قراءات/كتابات الإقلاع تمرّ من هنا بمهلة + التقاط
  // استثناء، فلا يتجمّد التطبيق على شاشة البداية أبداً (يعود null/يتجاهل بهدوء).
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
    } catch (_) {
      // فشل/تعليق التخزين لا يجب أن يكسر التدفّق
    }
  }

  static Future<void> _delete(String key) async {
    try {
      await _storage.delete(key: key).timeout(_ioTimeout);
    } catch (_) {}
  }

  static Future<void> _deleteAll() async {
    try {
      await _storage.deleteAll().timeout(_ioTimeout);
    } catch (_) {}
  }

  static const _keyToken = 'hancr_access_token';
  static const _keyRiderId = 'hancr_rider_id';
  static const _keyPhone = 'hancr_phone';

  // ── Token ─────────────────────────────────────────────────────────────────
  static Future<void> saveToken(String token) => _write(_keyToken, token);

  static Future<String?> getToken() => _read(_keyToken);

  static Future<bool> hasToken() async {
    final token = await _read(_keyToken);
    return token != null && token.isNotEmpty;
  }

  static Future<void> deleteToken() => _delete(_keyToken);

  // ── Rider ─────────────────────────────────────────────────────────────────
  static Future<void> saveRiderId(int id) => _write(_keyRiderId, id.toString());

  static Future<int?> getRiderId() async {
    final val = await _read(_keyRiderId);
    return val != null ? int.tryParse(val) : null;
  }

  static Future<void> savePhone(String phone) => _write(_keyPhone, phone);

  static Future<String?> getPhone() => _read(_keyPhone);

  // ── اللغة المختارة ──────────────────────────────────────────────────────────
  static const _keyLang = 'hancr_lang';
  static Future<void> saveLanguage(String code) => _write(_keyLang, code);
  static Future<String?> getLanguage() => _read(_keyLang);

  // ── تفضيل المظهر (system/light/dark) ────────────────────────────────────────
  static const _keyAppearance = 'hancr_appearance';
  static Future<void> saveAppearance(String mode) =>
      _write(_keyAppearance, mode);
  static Future<String?> getAppearance() => _read(_keyAppearance);

  // ── الوضع البسيط (تكبير الخط) ───────────────────────────────────────────────
  static const _keySimpleMode = 'hancr_simple_mode';
  static Future<void> saveSimpleMode(bool on) =>
      _write(_keySimpleMode, on ? '1' : '0');
  static Future<bool> getSimpleMode() async =>
      (await _read(_keySimpleMode)) == '1';

  // ── طريقة الدفع الافتراضية + ملف الركوب ─────────────────────────────────────
  static const _keyPaymentDefault = 'hancr_payment_default';
  static Future<void> savePaymentDefault(String mode) =>
      _write(_keyPaymentDefault, mode);
  static Future<String?> getPaymentDefault() => _read(_keyPaymentDefault);

  static const _keyRideProfile = 'hancr_ride_profile';
  static Future<void> saveRideProfile(String p) => _write(_keyRideProfile, p);
  static Future<String?> getRideProfile() => _read(_keyRideProfile);

  // ── تفضيل البيومترية (محلي على الجهاز) ──────────────────────────────────────
  static const _keyBiometric = 'hancr_biometric';
  static Future<void> saveBiometric(bool on) =>
      _write(_keyBiometric, on ? '1' : '0');
  static Future<bool> getBiometric() async =>
      (await _read(_keyBiometric)) == '1';

  // ── الفريق المختار (تجميلي، محلي) ───────────────────────────────────────────
  static const _keyTeam = 'hancr_team';
  static Future<void> saveTeam(String code) => _write(_keyTeam, code);
  static Future<String?> getTeam() => _read(_keyTeam);

  // ── N5 — Live SDUI theme cache ──────────────────────────────────────────────
  // يُخزَّن آخر themeConfig (JSON string) ليُطبَّق فوراً عند الإقلاع قبل وصول الشبكة.
  static const _keyTheme = 'hancr_theme_config';
  static Future<void> saveThemeConfig(String json) => _write(_keyTheme, json);
  static Future<String?> getThemeConfig() => _read(_keyTheme);

  // ── الحسابات المتعددة (تبديل الحساب) ────────────────────────────────────────
  // قائمة الحسابات المحفوظة [{token, riderId, phone, name}] — تبقى بعد تسجيل
  // الخروج ليتمكّن المستخدم من التبديل بينها دون إعادة دخول كامل.
  static const _keyAccounts = 'hancr_accounts';

  static Future<List<Map<String, dynamic>>> getAccounts() async {
    final raw = await _read(_keyAccounts);
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
    await _write(_keyAccounts, jsonEncode(list));
  }

  static Future<void> removeAccount(int riderId) async {
    final list = await getAccounts();
    list.removeWhere((a) => a['riderId'] == riderId);
    await _write(_keyAccounts, jsonEncode(list));
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
    final theme = await _read(_keyTheme);
    final accounts = await _read(_keyAccounts);
    final appearance = await _read(_keyAppearance);
    final simple = await _read(_keySimpleMode);
    await _deleteAll();
    if (theme != null) await _write(_keyTheme, theme);
    if (accounts != null) await _write(_keyAccounts, accounts);
    if (appearance != null) await _write(_keyAppearance, appearance);
    if (simple != null) await _write(_keySimpleMode, simple);
  }
}
