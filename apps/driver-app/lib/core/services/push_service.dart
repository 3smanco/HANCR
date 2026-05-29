import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart' show Color;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../graphql/graphql_client.dart';

/// PushService — إدارة Firebase Cloud Messaging للـ rider-app
///
/// المسؤوليات:
///  - تهيئة Firebase
///  - طلب صلاحية الإشعارات
///  - الحصول على FCM token وإرساله للسيرفر
///  - إظهار foreground notifications عبر flutter_local_notifications
///  - معالجة token refresh
///
/// الاستخدام:
/// ```dart
/// await PushService.instance.initialize();
/// // ... after login:
/// await PushService.instance.registerWithBackend();
/// ```
class PushService {
  PushService._();
  static final PushService instance = PushService._();

  static const _channelId = 'hancr_high_priority';
  static const _channelName = 'HANCR Notifications';
  static const _channelDesc = 'إشعارات الرحلات والعروض المهمة';

  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  String? _cachedToken;
  bool _initialized = false;

  // GraphQL: register the token in driver-api
  static const _updateTokenMutation = r'''
    mutation UpdateDriverFcmToken($token: String!) {
      updateDriverFcmToken(token: $token)
    }
  ''';

  static const _clearTokenMutation = r'''
    mutation ClearDriverFcmToken {
      clearDriverFcmToken
    }
  ''';

  /// Initialize Firebase + local notifications + listeners.
  /// Call once in `main()` before runApp.
  Future<void> initialize() async {
    if (_initialized) return;
    try {
      await Firebase.initializeApp();
      debugPrint('[Push] Firebase initialized');

      // ─── Local notifications (foreground display) ───
      const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosInit = DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      );
      await _localNotifications.initialize(
        const InitializationSettings(android: androidInit, iOS: iosInit),
      );

      // Android notification channel (required for Android 8+)
      await _localNotifications
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >()
          ?.createNotificationChannel(
            const AndroidNotificationChannel(
              _channelId,
              _channelName,
              description: _channelDesc,
              importance: Importance.high,
            ),
          );

      // ─── Listeners ───
      FirebaseMessaging.onMessage.listen(_onForegroundMessage);
      FirebaseMessaging.instance.onTokenRefresh.listen(_onTokenRefresh);

      _initialized = true;
    } catch (e) {
      debugPrint('[Push] Initialize failed: $e');
    }
  }

  /// Request notification permission + register the token with rider-api.
  /// Call after successful login.
  Future<String?> registerWithBackend() async {
    if (!_initialized) {
      await initialize();
    }

    try {
      // 1. Request permission (iOS / Android 13+)
      final settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      debugPrint('[Push] permission: ${settings.authorizationStatus}');

      // 2. Get token
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) {
        debugPrint('[Push] FCM token is null');
        return null;
      }
      _cachedToken = token;
      debugPrint('[Push] FCM token: ${token.substring(0, 20)}…');

      // 3. Send to backend (requires authenticated client)
      await _sendTokenToBackend(token);
      return token;
    } catch (e) {
      debugPrint('[Push] registerWithBackend failed: $e');
      return null;
    }
  }

  /// Clear the token from the backend (call on logout).
  Future<void> clearWithBackend() async {
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(
        MutationOptions(document: gql(_clearTokenMutation)),
      );
      await FirebaseMessaging.instance.deleteToken();
      _cachedToken = null;
      debugPrint('[Push] Token cleared');
    } catch (e) {
      debugPrint('[Push] clearWithBackend failed: $e');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internal
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> _onTokenRefresh(String token) async {
    debugPrint('[Push] Token refreshed');
    _cachedToken = token;
    await _sendTokenToBackend(token);
  }

  Future<void> _sendTokenToBackend(String token) async {
    final client = await GraphQLClientManager.get();
    final result = await client.mutate(
      MutationOptions(
        document: gql(_updateTokenMutation),
        variables: {'token': token},
      ),
    );
    if (result.hasException) {
      debugPrint('[Push] updateFcmToken exception: ${result.exception}');
    } else {
      debugPrint('[Push] Token registered with backend ✓');
    }
  }

  Future<void> _onForegroundMessage(RemoteMessage message) async {
    debugPrint(
      '[Push] Foreground message: ${message.notification?.title} — ${message.notification?.body}',
    );

    // Display the notification while the app is in foreground
    final notification = message.notification;
    if (notification != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channelId,
            _channelName,
            channelDescription: _channelDesc,
            importance: Importance.high,
            priority: Priority.high,
            color: const Color(0xFFB048FF), // HANCR violet
          ),
          iOS: const DarwinNotificationDetails(),
        ),
        payload: message.data.toString(),
      );
    }
  }
}
