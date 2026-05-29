import 'package:graphql_flutter/graphql_flutter.dart';
import '../config/app_config.dart';
import '../services/storage_service.dart';

/// Manages the singleton GraphQL client.
/// Call [reset] after login/logout so the new token is picked up.
class GraphQLClientManager {
  GraphQLClientManager._();

  static GraphQLClient? _client;

  static Future<GraphQLClient> get() async {
    _client ??= await _build();
    return _client!;
  }

  /// Must be called after login (new token) or logout (no token)
  static Future<void> reset() async {
    _client = await _build();
  }

  static Future<GraphQLClient> _build() async {
    final token = await StorageService.getToken() ?? '';
    final authHeader =
        token.isNotEmpty ? {'Authorization': 'Bearer $token'} : <String, String>{};

    final httpLink = HttpLink(
      AppConfig.graphqlUrl,
      defaultHeaders: authHeader,
    );

    final wsLink = WebSocketLink(
      AppConfig.wsUrl,
      config: SocketClientConfig(
        autoReconnect: true,
        initialPayload: token.isNotEmpty
            ? {'Authorization': 'Bearer $token'}
            : <String, dynamic>{},
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
      defaultPolicies: DefaultPolicies(
        query: Policies(fetch: FetchPolicy.networkOnly),
        mutate: Policies(fetch: FetchPolicy.networkOnly),
      ),
    );
  }
}
