import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../graphql/graphql_client.dart';
import '../graphql/gql/rider_gql.dart';
import '../services/storage_service.dart';
import 'aurora_theme.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N5 — ThemeController                                          ║
/// ║                                                               ║
/// ║  مصدر الحقيقة لحالة الثيم الحي في التطبيق:                     ║
/// ║   1. عند الإقلاع: يطبّق الثيم المخزَّن محلياً فوراً (لا وميض).  ║
/// ║   2. ثم يجلب أحدث themeConfig من الخادم (استعلام عام).         ║
/// ║   3. عند أي تغيير يرفع [version] ويُخطر المستمعين → إعادة بناء  ║
/// ║      كامل لـ MaterialApp فتلتقط كل الـ widgets الألوان الجديدة.║
/// ╚══════════════════════════════════════════════════════════════╝
class ThemeController extends ChangeNotifier {
  ThemeController._();
  static final ThemeController instance = ThemeController._();

  /// يُستخدم كـ key لـ MaterialApp لإجبار إعادة بناء الشجرة عند تغيّر الثيم.
  int _version = 0;
  int get version => _version;

  bool _bootstrapped = false;

  /// تفضيل المظهر المختار محلياً: 'system' | 'light' | 'dark'.
  /// ملاحظة: الهوية الداكنة محفوظة — حتى يُصمَّم وضع فاتح، يبقى العرض داكناً
  /// (theme و darkTheme كلاهما AuroraTheme.dark)، والتفضيل يُخزَّن للمستقبل.
  String _appearanceMode = 'dark';
  String get appearanceMode => _appearanceMode;

  ThemeMode get themeMode {
    switch (_appearanceMode) {
      case 'light':
        return ThemeMode.light;
      case 'system':
        return ThemeMode.system;
      default:
        return ThemeMode.dark;
    }
  }

  /// يغيّر تفضيل المظهر ويحفظه ويعيد بناء MaterialApp.
  Future<void> setAppearanceMode(String mode) async {
    if (mode != 'system' && mode != 'light' && mode != 'dark') return;
    if (mode == _appearanceMode) return;
    _appearanceMode = mode;
    await StorageService.saveAppearance(mode);
    _version++;
    notifyListeners();
  }

  /// يُستدعى مرة واحدة قبل runApp. يطبّق الكاش ثم يجلب من الخادم (بدون حجب).
  Future<void> bootstrap() async {
    if (_bootstrapped) return;
    _bootstrapped = true;

    // 0) تحميل تفضيل المظهر المخزَّن.
    try {
      _appearanceMode = await StorageService.getAppearance() ?? 'dark';
    } catch (_) {
      _appearanceMode = 'dark';
    }

    // 1) تطبيق الكاش المحلي فوراً (إن وُجد) — لا ننتظر الشبكة.
    try {
      final cached = await StorageService.getThemeConfig();
      if (cached != null && cached.isNotEmpty) {
        final map = jsonDecode(cached);
        if (map is Map<String, dynamic>) AuroraThemeData.apply(map);
      }
    } catch (e) {
      debugPrint('[ThemeController] cache apply skipped: $e');
    }

    // 2) جلب أحدث ثيم من الخادم في الخلفية (fire-and-forget).
    unawaited(refresh());
  }

  /// يجلب أحدث themeConfig من الخادم ويطبّقه. آمن للاستدعاء في أي وقت
  /// (مثلاً عند عودة التطبيق من الخلفية). يفشل بصمت ويُبقي الثيم الحالي.
  Future<void> refresh() async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await client
          .query(QueryOptions(
            document: gql(appThemeQuery),
            fetchPolicy: FetchPolicy.networkOnly,
          ))
          .timeout(const Duration(seconds: 6));

      if (res.hasException) {
        debugPrint('[ThemeController] fetch error: ${res.exception}');
        return;
      }

      final theme = res.data?['appTheme'];
      if (theme is! Map<String, dynamic> || theme.isEmpty) return;

      AuroraThemeData.apply(theme);
      await StorageService.saveThemeConfig(jsonEncode(theme));
      _version++;
      notifyListeners();
    } catch (e) {
      debugPrint('[ThemeController] refresh skipped: $e');
    }
  }
}
