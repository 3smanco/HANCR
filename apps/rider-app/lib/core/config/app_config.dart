/// HANCR App Configuration
///
/// كل القيم تُحقن عبر `--dart-define` عند build.
/// أمثلة:
///   flutter run --dart-define=ENV=production
///   flutter build apk --dart-define=ENV=production --dart-define=SENTRY_DSN=...
///
/// dev (افتراضي):
///   - يستخدم 10.0.2.2 (Android emulator → host machine)
///   - HTTP (بدون TLS)
///
/// production:
///   - https://api.hancr.com/rider
///   - WebSocket: wss://api.hancr.com/rider
class AppConfig {
  AppConfig._();

  // ── Environment ───────────────────────────────────────────────────────────
  static const String env = String.fromEnvironment('ENV', defaultValue: 'development');
  static bool get isProduction => env == 'production';
  static bool get isStaging => env == 'staging';
  static bool get isDevelopment => env == 'development';

  // ── API Endpoints ─────────────────────────────────────────────────────────
  static const String _devHost = String.fromEnvironment(
    'API_HOST',
    defaultValue: '10.0.2.2', // Android emulator → host machine
  );
  static const int _devPort = 3000;

  /// HTTP endpoint للـ GraphQL queries/mutations
  static String get graphqlUrl {
    if (isProduction) return 'https://api.hancr.com/rider/graphql';
    if (isStaging) return 'https://staging-api.hancr.com/rider/graphql';
    return 'http://$_devHost:$_devPort/graphql';
  }

  /// WebSocket endpoint للـ subscriptions
  static String get wsUrl {
    if (isProduction) return 'wss://api.hancr.com/rider/graphql';
    if (isStaging) return 'wss://staging-api.hancr.com/rider/graphql';
    return 'ws://$_devHost:$_devPort/graphql';
  }

  /// Base URL لأي REST endpoints (مثل: payment webhook callbacks)
  static String get baseUrl {
    if (isProduction) return 'https://api.hancr.com/rider';
    if (isStaging) return 'https://staging-api.hancr.com/rider';
    return 'http://$_devHost:$_devPort';
  }

  // ── Google Maps ───────────────────────────────────────────────────────────
  /// Set in `android/app/src/main/AndroidManifest.xml` و iOS plist.
  static const String googleMapsApiKey = String.fromEnvironment(
    'MAPS_API_KEY',
    defaultValue: '',
  );

  // ── Google Sign-In ────────────────────────────────────────────────────────
  /// Web OAuth client ID (من Google Cloud) — لازم لإرجاع idToken للخادم.
  /// فارغ = زر Google معطّل (يُظهر رسالة "غير مُهيّأ بعد").
  static const String googleServerClientId = String.fromEnvironment(
    'GOOGLE_SERVER_CLIENT_ID',
    defaultValue: '',
  );

  // ── OTP ───────────────────────────────────────────────────────────────────
  static const int otpLength = 6;
  static const int otpResendSeconds = 30;

  // ── Defaults ──────────────────────────────────────────────────────────────
  static const int defaultRegionId = 3; // Saudi Arabia / Riyadh (DB region id)
  static const double defaultLat = 24.7136;
  static const double defaultLng = 46.6753;

  // ── Deep links ────────────────────────────────────────────────────────────
  /// Universal/App Links domain
  static const String deepLinkDomain = 'hancr.com';
}
