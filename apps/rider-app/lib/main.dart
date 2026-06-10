import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app.dart';
import 'core/i18n/app_localization.dart';
import 'core/services/push_service.dart';
import 'core/theme/theme_controller.dart';

/// Sentry معطَّل مؤقتاً للـ demo. سيُفعَّل في production build.
Future<void> main() async {
  // ── حماية جذرية ضد الشاشة السوداء ──────────────────────────────────────
  // أي استثناء أثناء build لأي widget يعرض رسالة مرئية بدل شاشة سوداء صامتة.
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

  // runZonedGuarded يلتقط الأخطاء غير المتزامنة بحيث لا يموت التطبيق بصمت.
  runZonedGuarded<Future<void>>(() async {
    WidgetsFlutterBinding.ensureInitialized();

    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);

    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: Color(0xFF0A0807),
      ),
    );

    // تحميل اللغة (المحفوظة أو لغة الجهاز)
    await LocaleController.instance.load();

    // N5 — تطبيق الثيم الحي المخزَّن محلياً قبل أول إطار (يمنع وميض الألوان)،
    // ثم جلب أحدث ثيم من الخادم في الخلفية.
    await ThemeController.instance.bootstrap();

    // تهيئة الإشعارات — لا تُعطّل الإقلاع لو فشلت (محاطة بـ try داخلياً أيضاً)
    try {
      await PushService.instance.initialize();
    } catch (e) {
      debugPrint('[main] PushService init skipped: $e');
    }

    runApp(const HancrRiderApp());
  }, (error, stack) {
    debugPrint('[main] Uncaught zone error: $error\n$stack');
  });
}
