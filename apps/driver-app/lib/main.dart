import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'app.dart';
import 'core/config/app_config.dart';
import 'core/i18n/app_localization.dart';
import 'core/services/push_service.dart';
import 'core/theme/theme_controller.dart';

Future<void> main() async {
  // ── حماية جذرية ضد الشاشة السوداء ──────────────────────────────────────
  ErrorWidget.builder = (FlutterErrorDetails details) {
    return Container(
      color: const Color(0xFF0A0807),
      alignment: Alignment.center,
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, color: Color(0xFFFF7A1A), size: 48),
          const SizedBox(height: 16),
          const Text(
            'حدث خطأ غير متوقع',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFFFFF5EE),
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            details.exceptionAsString(),
            textAlign: TextAlign.center,
            maxLines: 6,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Color(0xFFA89B96), fontSize: 12),
          ),
        ],
      ),
    );
  };

  if (AppConfig.sentryDsn.isEmpty) {
    await _bootstrap();
    return;
  }

  await SentryFlutter.init((options) {
    options.dsn = AppConfig.sentryDsn;
    options.environment = AppConfig.env;
    options.release = AppConfig.sentryRelease;
    options.tracesSampleRate = AppConfig.isProduction ? 0.1 : 1.0;
  }, appRunner: _bootstrap);
}

Future<void> _bootstrap() async {
  runZonedGuarded<Future<void>>(
    () async {
      WidgetsFlutterBinding.ensureInitialized();
      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
      ]);
      SystemChrome.setSystemUIOverlayStyle(
        const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
          systemNavigationBarColor: Color(0xFF0A0807),
        ),
      );
      await LocaleController.instance.load();

      // N5 — تطبيق الثيم الحي المخزَّن محلياً قبل أول إطار، ثم جلب أحدثه من الخادم.
      await ThemeController.instance.bootstrap();

      try {
        await PushService.instance.initialize();
      } catch (e) {
        debugPrint('[main] PushService init skipped: $e');
      }
      runApp(const HancrCaptainApp());
    },
    (error, stack) {
      debugPrint('[main] Uncaught zone error: $error\n$stack');
      if (AppConfig.sentryDsn.isNotEmpty) {
        unawaited(Sentry.captureException(error, stackTrace: stack));
      }
    },
  );
}
