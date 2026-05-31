import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app.dart';
import 'core/i18n/app_localization.dart';
import 'core/services/push_service.dart';

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

  runZonedGuarded<Future<void>>(() async {
    WidgetsFlutterBinding.ensureInitialized();
    await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: Color(0xFF0A0807),
      ),
    );
    await LocaleController.instance.load();
    try {
      await PushService.instance.initialize();
    } catch (e) {
      debugPrint('[main] PushService init skipped: $e');
    }
    runApp(const HancrCaptainApp());
  }, (error, stack) {
    debugPrint('[main] Uncaught zone error: $error\n$stack');
  });
}
