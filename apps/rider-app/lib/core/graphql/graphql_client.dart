import 'package:graphql_flutter/graphql_flutter.dart';
import '../config/app_config.dart';
import '../services/storage_service.dart';

/// Manages the singleton GraphQL client.
/// Call [reset] after login/logout so the new token is picked up.
class GraphQLClientManager {
  GraphQLClientManager._();

  static GraphQLClient? _client;

  /// يُستدعى عند رصد خطأ مصادقة (Unauthorized / 401) من أي طلب.
  /// تربطه طبقة التطبيق (app.dart) ببعث [AuthLogoutRequested] حتى لا يبقى
  /// المستخدم محبوساً في حالة «داخل لكن مرفوض». يُحرس بعلَم لتفادي تكرار البعث.
  static void Function()? onUnauthorized;
  static bool _authErrorHandled = false;

  static Future<GraphQLClient> get() async {
    _client ??= await _build();
    return _client!;
  }

  /// Must be called after login (new token) or logout (no token).
  /// يعيد بناء العميل أساساً لأجل اشتراكات WebSocket (تأخذ التوكن من
  /// initialPayload وقت البناء). طلبات HTTP تقرأ التوكن لكل طلب عبر [AuthLink]
  /// فلا تتأثر بالتوقيت أصلاً. يُصفّر علَم خطأ المصادقة عند كل إعادة بناء.
  static Future<void> reset() async {
    _authErrorHandled = false;
    _client = await _build();
  }

  /// يُفحص رسالة الخطأ: هل هي خطأ مصادقة؟
  static bool _isAuthMessage(String? message) {
    if (message == null) return false;
    final m = message.toLowerCase();
    return m.contains('unauthorized') || m.contains('unauthenticated');
  }

  /// يُطلق رد فعل تسجيل الخروج مرة واحدة فقط (حتى لا يتكرر مع كل طلب فاشل).
  static void _fireAuthError() {
    if (_authErrorHandled) return;
    _authErrorHandled = true;
    onUnauthorized?.call();
  }

  static Future<GraphQLClient> _build() async {
    // AuthLink: يقرأ التوكن من التخزين الآمن **عند كل طلب** بدل خبزه وقت
    // البناء — هذا يقضي على خطأ Unauthorized بعد الدخول الجديد نهائياً.
    final authLink = AuthLink(
      getToken: () async {
        final token = await StorageService.getToken();
        return (token != null && token.isNotEmpty) ? 'Bearer $token' : null;
      },
    );

    // ErrorLink: يرصد أخطاء المصادقة (GraphQL أو HTTP 401) ويُطلق تسجيل
    // الخروج التلقائي، مع إعادة بثّ النتيجة/الاستثناء ليعالجه المستدعي عادياً.
    final errorLink = ErrorLink(
      onGraphQLError: (request, forward, response) async* {
        final errors = response.errors ?? const [];
        if (errors.any((e) => _isAuthMessage(e.message))) {
          _fireAuthError();
        }
        yield response;
      },
      onException: (request, forward, exception) async* {
        // بعض البوابات تُعيد 401 كاستثناء خادم يحمل أخطاء GraphQL مُحلَّلة.
        if (exception is ServerException) {
          final errs = exception.parsedResponse?.errors ?? const [];
          if (errs.any((e) => _isAuthMessage(e.message))) {
            _fireAuthError();
          }
        }
        // أعِد رمي الاستثناء ليصل للمستدعي ويُعالَج (لا نبتلعه).
        throw exception;
      },
    );

    // التوكن للـ WebSocket فقط (initialPayload وقت البناء) — لذا يُعاد بناء
    // العميل بعد الدخول عبر reset() لتحديث اشتراكات التتبع الحي.
    final token = await StorageService.getToken() ?? '';

    final httpLink = HttpLink(AppConfig.graphqlUrl);

    final wsLink = WebSocketLink(
      AppConfig.wsUrl,
      config: SocketClientConfig(
        autoReconnect: true,
        initialPayload: token.isNotEmpty
            ? {'Authorization': 'Bearer $token'}
            : <String, dynamic>{},
      ),
    );

    final transportLink = Link.split(
      (request) => request.isSubscription,
      wsLink,
      httpLink,
    );

    // الترتيب: errorLink ← authLink ← transport. authLink لا يُطبَّق على
    // الاشتراكات (الـ WS يصادق عبر initialPayload) لكن وجوده غير ضار لها.
    final link = Link.from([errorLink, authLink, transportLink]);

    return GraphQLClient(
      link: link,
      cache: GraphQLCache(store: InMemoryStore()),
      defaultPolicies: DefaultPolicies(
        query: Policies(fetch: FetchPolicy.networkOnly),
        mutate: Policies(fetch: FetchPolicy.networkOnly),
      ),
    );
  }
}
