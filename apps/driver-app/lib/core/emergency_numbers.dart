/// أرقام الطوارئ حسب رمز الدولة (E.164). الافتراضي 112.
class EmergencyNumbers {
  EmergencyNumbers._();

  static const Map<String, String> _byCode = {
    '+966': '999',
    '+974': '999',
    '+971': '999',
    '+965': '112',
    '+973': '999',
    '+968': '9999',
    '+20': '122',
    '+962': '911',
    '+1': '911',
    '+44': '999',
    '+33': '112',
    '+90': '112',
    '+91': '112',
  };

  static String forCountryCode(String? code) {
    if (code == null || code.isEmpty) return '112';
    return _byCode[code] ?? '112';
  }
}
