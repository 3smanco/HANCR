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

  /// تفضيل المظهر المختار محلياً: 'system' | 'light' | 'dark' | 'vip'.
  /// السكين يُطبَّق فعلياً على لوحة AuroraColors عبر applySkin، فتتبدّل كل
  /// الشاشات (التي تقرأ AuroraColors.*) عند إعادة بناء MaterialApp.
  String _appearanceMode = 'dark';
  String get appearanceMode => _appearanceMode;

  /// آخر إعداد SDUI مطبَّق (يُعاد تطبيقه فوق السكين عند تبديله).
  Map<String, dynamic>? _lastConfig;

  ThemeMode get themeMode {
    switch (_appearanceMode) {
      case 'light':
        return ThemeMode.light;
      case 'system':
        return ThemeMode.system;
      default: // dark | vip
        return ThemeMode.dark;
    }
  }

  /// يحوّل تفضيل المظهر إلى اسم سكين فعلي ('dark'|'light'|'vip').
  String _skinFor() {
    switch (_appearanceMode) {
      case 'light':
        return 'light';
      case 'vip':
        return 'vip';
      case 'system':
        final b =
            WidgetsBinding.instance.platformDispatcher.platformBrightness;
        return b == Brightness.light ? 'light' : 'dark';
      default:
        return 'dark';
    }
  }

  /// يطبّق السكين الحالي، ثم إعداد SDUI فوقه — لكن فقط للسكين الداكن
  /// (إعداد الأدمن مُصمَّم للهوية الداكنة؛ لا يُطبَّق على الفاتح/VIP).
  void _repaint() {
    final skin = _skinFor();
    AuroraColors.applySkin(skin);
    if (skin == 'dark' && _lastConfig != null) {
      AuroraThemeData.apply(_lastConfig);
    }
  }

  /// الوضع البسيط (تكبير الخط لكبار السن) — يُطبَّق كـ textScaler في app.dart.
  bool _simpleMode = false;
  bool get simpleMode => _simpleMode;
  double get textScale => _simpleMode ? 1.3 : 1.0;

  Future<void> setSimpleMode(bool on) async {
    if (on == _simpleMode) return;
    _simpleMode = on;
    await StorageService.saveSimpleMode(on);
    _version++;
    notifyListeners();
  }

  /// يغيّر تفضيل المظهر ويحفظه ويعيد بناء MaterialApp بالسكين الجديد.
  Future<void> setAppearanceMode(String mode) async {
    if (mode != 'system' && mode != 'light' && mode != 'dark' && mode != 'vip') {
      return;
    }
    if (mode == _appearanceMode) return;
    _appearanceMode = mode;
    _repaint(); // طلاء السكين الجديد فوراً
    await StorageService.saveAppearance(mode);
    _version++;
    notifyListeners();
  }

  /// يُستدعى مرة واحدة قبل runApp. يطبّق الكاش ثم يجلب من الخادم (بدون حجب).
  Future<void> bootstrap() async {
    if (_bootstrapped) return;
    _bootstrapped = true;

    // 0) تحميل تفضيل المظهر + الوضع البسيط المخزَّنين.
    try {
      // الافتراضي للمستخدمين الجدد: «تلقائي» (يتبع سطوع الجهاز، السكينان مفعّلان).
      // مَن اختار سابقاً يبقى على اختياره المحفوظ.
      _appearanceMode = await StorageService.getAppearance() ?? 'system';
      _simpleMode = await StorageService.getSimpleMode();
    } catch (_) {
      _appearanceMode = 'system';
    }

    // 1) تحميل كاش إعداد SDUI (إن وُجد) ثم طلاء السكين + SDUI عبر _repaint.
    try {
      final cached = await StorageService.getThemeConfig();
      if (cached != null && cached.isNotEmpty) {
        final map = jsonDecode(cached);
        if (map is Map<String, dynamic>) _lastConfig = map;
      }
    } catch (e) {
      debugPrint('[ThemeController] cache load skipped: $e');
    }
    _repaint();

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

      _lastConfig = theme;
      // أعِد طلاء السكين ثم طبّق SDUI فوقه (حتى لا تطمس قيم السكين).
      _repaint();
      await StorageService.saveThemeConfig(jsonEncode(theme));
      _version++;
      notifyListeners();
    } catch (e) {
      debugPrint('[ThemeController] refresh skipped: $e');
    }
  }
}
