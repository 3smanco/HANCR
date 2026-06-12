/// HANCR Driver App Configuration
///
/// كل القيم تُحقن عبر `--dart-define` عند build.
/// أمثلة:
///   flutter run --dart-define=ENV=production
///   flutter build apk --dart-define=ENV=production --dart-define=SENTRY_DSN=...
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
    defaultValue: '10.0.2.2',
  );
  static const int _devPort = 3001;

  static String get httpUrl {
    if (isProduction) return 'https://api.hancr.com/driver/graphql';
    if (isStaging) return 'https://staging-api.hancr.com/driver/graphql';
    return 'http://$_devHost:$_devPort/graphql';
  }

  static String get wsUrl {
    if (isProduction) return 'wss://api.hancr.com/driver/graphql';
    if (isStaging) return 'wss://staging-api.hancr.com/driver/graphql';
    return 'ws://$_devHost:$_devPort/graphql';
  }

  // ── Google Maps ───────────────────────────────────────────────────────────
  static const String googleMapsApiKey = String.fromEnvironment(
    'MAPS_KEY',
    defaultValue: 'AIzaSyCwLtWyS6m44JNXWjTRCyOkR83GirSkZ3o',
  );

  // ── Google Sign-In ────────────────────────────────────────────────────────
  /// Web OAuth client ID — لازم لإرجاع idToken للخادم. فارغ = الزرّ معطّل.
  static const String googleServerClientId = String.fromEnvironment(
    'GOOGLE_SERVER_CLIENT_ID',
    defaultValue: '',
  );

  // ── Defaults ──────────────────────────────────────────────────────────────
  static const int defaultRegionId = 1;
  static const double defaultLat = 24.7136;
  static const double defaultLng = 46.6753;

  /// Location update interval in seconds
  static const int locationUpdateIntervalSeconds = 4;

  // ── Deep links ────────────────────────────────────────────────────────────
  static const String deepLinkDomain = 'hancr.com';
}
