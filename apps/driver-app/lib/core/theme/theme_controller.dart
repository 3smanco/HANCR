import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../graphql/graphql_client.dart';
import '../graphql/gql/driver_gql.dart';
import '../services/storage_service.dart';
import 'aurora_theme.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N5 — ThemeController (تطبيق السائق)                           ║
/// ║                                                               ║
/// ║  مصدر الحقيقة لحالة الثيم الحي:                                ║
/// ║   1. عند الإقلاع: يطبّق الثيم المخزَّن محلياً فوراً (لا وميض).  ║
/// ║   2. ثم يجلب أحدث themeConfig من الخادم (استعلام عام).         ║
/// ║   3. عند أي تغيير يرفع [version] ويُخطر المستمعين → إعادة بناء  ║
/// ║      كامل لـ MaterialApp فتلتقط كل الـ widgets الألوان الجديدة.║
/// ║  ملاحظة: الراكب والسائق يقرآن نفس صف 'main' فالثيم موحَّد.      ║
/// ╚══════════════════════════════════════════════════════════════╝
class ThemeController extends ChangeNotifier {
  ThemeController._();
  static final ThemeController instance = ThemeController._();

  int _version = 0;
  int get version => _version;

  bool _bootstrapped = false;

  /// يُستدعى مرة واحدة قبل runApp. يطبّق الكاش ثم يجلب من الخادم (بدون حجب).
  Future<void> bootstrap() async {
    if (_bootstrapped) return;
    _bootstrapped = true;

    try {
      final cached = await StorageService.getThemeConfig();
      if (cached != null && cached.isNotEmpty) {
        final map = jsonDecode(cached);
        if (map is Map<String, dynamic>) AuroraThemeData.apply(map);
      }
    } catch (e) {
      debugPrint('[ThemeController] cache apply skipped: $e');
    }

    unawaited(refresh());
  }

  /// يجلب أحدث themeConfig من الخادم ويطبّقه. يفشل بصمت ويُبقي الثيم الحالي.
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
