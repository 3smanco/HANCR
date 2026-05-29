import 'package:graphql_flutter/graphql_flutter.dart';
import '../config/app_config.dart';
import '../services/storage_service.dart';

class GraphQLClientManager {
  GraphQLClientManager._();

  static GraphQLClient? _client;

  static Future<GraphQLClient> get() async {
    if (_client != null) return _client!;
    _client = await _build();
    return _client!;
  }

  static Future<void> reset() async {
    _client = null;
    _client = await _build();
  }

  static Future<GraphQLClient> _build() async {
    final token = await StorageService.getToken();

    final httpLink = HttpLink(
      AppConfig.httpUrl,
      defaultHeaders: token != null
          ? {'Authorization': 'Bearer $token'}
          : const {},
    );

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

    final link = Link.split(
      (request) => request.isSubscription,
      wsLink,
      httpLink,
    );

    return GraphQLClient(
      link: link,
      cache: GraphQLCache(store: InMemoryStore()),
    );
  }
}
