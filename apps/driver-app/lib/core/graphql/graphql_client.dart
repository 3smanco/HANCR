import 'package:graphql_flutter/graphql_flutter.dart';
import '../config/app_config.dart';
import '../services/storage_service.dart';

class GraphQLClientManager {
  GraphQLClientManager._();

  static GraphQLClient? _client;

  /// يُستدعى عند رصد خطأ مصادقة (Unauthorized / 401) من أي طلب.
  /// تربطه طبقة التطبيق (app.dart) ببعث [AuthLogoutRequested] حتى لا يبقى
  /// السائق محبوساً في حالة «داخل لكن مرفوض». يُحرس بعلَم لتفادي تكرار البعث.
  static void Function()? onUnauthorized;
  static bool _authErrorHandled = false;

  static Future<GraphQLClient> get() async {
    if (_client != null) return _client!;
    _client = await _build();
    return _client!;
  }

  static Future<void> reset() async {
    _authErrorHandled = false;
    _client = null;
    _client = await _build();
  }

  static bool _isAuthMessage(String? message) {
    if (message == null) return false;
    final m = message.toLowerCase();
    return m.contains('unauthorized') || m.contains('unauthenticated');
  }

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

    // ErrorLink: يرصد أخطاء المصادقة (GraphQL أو خادم) ويُطلق تسجيل الخروج
    // التلقائي، مع إعادة بثّ النتيجة/الاستثناء ليعالجه المستدعي عادياً.
    final errorLink = ErrorLink(
      onGraphQLError: (request, forward, response) async* {
        final errors = response.errors ?? const [];
        if (errors.any((e) => _isAuthMessage(e.message))) {
          _fireAuthError();
        }
        yield response;
      },
      onException: (request, forward, exception) async* {
        if (exception is ServerException) {
          final errs = exception.parsedResponse?.errors ?? const [];
          if (errs.any((e) => _isAuthMessage(e.message))) {
            _fireAuthError();
          }
        }
        throw exception;
      },
    );

    // التوكن للـ WebSocket فقط (initialPayload وقت البناء) — لذا يُعاد بناء
    // العميل بعد الدخول عبر reset() لتحديث اشتراكات الطلبات الحية.
    final token = await StorageService.getToken();

    final httpLink = HttpLink(AppConfig.httpUrl);

    final wsLink = WebSocketLink(
      AppConfig.wsUrl,
      config: SocketClientConfig(
        autoReconnect: true,
        inactivityTimeout: const Duration(seconds: 30),
        initialPayload: token != null
            ? () async => {'Authorization': 'Bearer $token'}
            : null,
      ),
    );

    final transportLink = Link.split(
      (request) => request.isSubscription,
      wsLink,
      httpLink,
    );

    final link = Link.from([errorLink, authLink, transportLink]);

    return GraphQLClient(
      link: link,
      cache: GraphQLCache(store: InMemoryStore()),
    );
  }
}
