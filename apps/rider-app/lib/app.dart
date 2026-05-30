import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'blocs/auth/auth_bloc.dart';
import 'blocs/auth/auth_event.dart';
import 'blocs/auth/auth_state.dart';
import 'blocs/order/order_bloc.dart';
import 'blocs/order/order_event.dart';
import 'blocs/order/order_state.dart';
import 'blocs/rider/rider_bloc.dart';
import 'blocs/rider/rider_event.dart';
import 'core/router/app_router.dart';
import 'core/services/push_service.dart';
import 'core/theme/aurora_theme.dart';
import 'screens/auth/aurora_otp_screen.dart';
import 'screens/auth/aurora_phone_screen.dart';
import 'core/models/order_model.dart';
import 'screens/booking/pickup_confirmation_screen.dart';
import 'screens/booking/trip_end_screen.dart';
import 'screens/main/aurora_main_screen.dart';
import 'screens/showcase/design_showcase_screen.dart';
import 'screens/wallet/aurora_wallet_screen.dart';
import 'screens/splash/splash_screen.dart';
import 'screens/tracking/aurora_rate_driver_screen.dart';
import 'screens/tracking/aurora_tracking_screen.dart';

class HancrRiderApp extends StatefulWidget {
  const HancrRiderApp({super.key});

  @override
  State<HancrRiderApp> createState() => _HancrRiderAppState();
}

class _HancrRiderAppState extends State<HancrRiderApp> {
  late final AuthBloc _authBloc;
  late final OrderBloc _orderBloc;
  late final RiderBloc _riderBloc;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authBloc = AuthBloc()..add(const AuthCheckRequested());
    _orderBloc = OrderBloc();
    _riderBloc = RiderBloc();
    _router = _buildRouter();
  }

  GoRouter _buildRouter() {
    return GoRouter(
      navigatorKey: rootNavigatorKey,
      initialLocation: '/splash',
      refreshListenable: _GoRouterRefreshStream(
        StreamGroup.merge<void>([
          _authBloc.stream.map<void>((_) {}),
          _orderBloc.stream.map<void>((_) {}),
        ]),
      ),
      redirect: (context, state) {
        final authState = _authBloc.state;
        final orderState = _orderBloc.state;
        final loc = state.matchedLocation;

        // Showcase + previews: bypass auth (dev-only visual reference)
        if (loc == '/showcase' || loc.startsWith('/preview')) return null;

        // بدء التطبيق الحقيقي فقط (فحص التوكن) → splash
        if (authState is AuthInitial) {
          return loc == '/splash' ? null : '/splash';
        }

        // AuthLoading يحدث أيضاً أثناء إرسال/تحقق OTP — لا نقذف المستخدم لـ splash
        // إذا كان داخل تدفق المصادقة؛ نتركه في شاشته (هاتف/OTP).
        if (authState is AuthLoading) {
          if (loc.startsWith('/auth') || loc == '/splash') return null;
          return '/splash';
        }

        // Not authenticated
        if (authState is AuthUnauthenticated || authState is AuthError) {
          if (loc.startsWith('/auth')) return null;
          return '/auth/phone';
        }

        // Authenticated
        if (authState is AuthAuthenticated) {
          if (loc == '/splash' || loc.startsWith('/auth')) return '/home';

          if ((orderState is OrderActive || orderState is OrderCreated) &&
              loc != '/tracking') {
            return '/tracking';
          }
          if (orderState is OrderAwaitingReview && loc != '/rate') {
            return '/rate';
          }
          if ((orderState is OrderRatingSubmitted || orderState is OrderIdle) &&
              (loc == '/tracking' || loc == '/rate')) {
            return '/home';
          }
        }

        return null;
      },
      routes: [
        GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
        GoRoute(path: '/auth/phone', builder: (_, __) => const AuroraPhoneScreen()),
        GoRoute(
          path: '/auth/otp',
          builder: (_, state) {
            // يقبل إما String مباشر (من aurora_phone_screen) أو Map (legacy)
            String phone = '';
            String? devOtp;
            if (state.extra is String) {
              phone = state.extra as String;
            } else if (state.extra is Map) {
              final m = state.extra as Map<String, dynamic>;
              phone = m['phone'] as String? ?? '';
              devOtp = m['devOtp'] as String?;
            }
            return AuroraOtpScreen(phone: phone, devOtp: devOtp);
          },
        ),
        GoRoute(path: '/home', builder: (_, __) => const AuroraMainScreen()),
        GoRoute(path: '/wallet', builder: (_, __) => const AuroraWalletScreen()),
        GoRoute(path: '/tracking', builder: (_, __) => const AuroraTrackingScreen()),
        GoRoute(path: '/rate', builder: (_, __) => const AuroraRateDriverScreen()),
        // Dev-only — visual showcase for the new design system
        GoRoute(
          path: '/showcase',
          builder: (_, __) => const DesignShowcaseScreen(),
        ),
        // Dev-only — preview pickup confirmation with mock data
        GoRoute(
          path: '/preview/pickup',
          builder: (_, __) => const PickupConfirmationScreen(
            initialOrigin: GeoPoint(lat: 24.7136, lng: 46.6753),
            destination: GeoPoint(lat: 24.7236, lng: 46.6853),
            originAddress: 'شارع الملك فهد، الرياض',
            destinationAddress: 'العليا',
            estimatedFare: 25,
            estimatedEta: 4,
          ),
        ),
        // Dev-only — preview trip-end rating screen
        GoRoute(
          path: '/preview/trip-end',
          builder: (_, __) => const TripEndScreen(
            driverName: 'أحمد المطيري',
            vehicleLabel: 'تويوتا كامري • أب ج 4521',
            fareAmount: 25.50,
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _authBloc.close();
    _orderBloc.close();
    _riderBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _authBloc),
        BlocProvider.value(value: _orderBloc),
        BlocProvider.value(value: _riderBloc),
      ],
      child: BlocListener<AuthBloc, AuthState>(
        bloc: _authBloc,
        listener: (ctx, state) {
          if (state is AuthAuthenticated) {
            _riderBloc.add(const RiderLoadRequested());
            _orderBloc.add(const OrderActiveCheckRequested());
            // Register FCM token with backend (fire-and-forget)
            PushService.instance.registerWithBackend();
          }
        },
        child: MaterialApp.router(
          title: 'HANCR',
          theme: AuroraTheme.dark,
          darkTheme: AuroraTheme.dark,
          themeMode: ThemeMode.dark,
          routerConfig: _router,
          debugShowCheckedModeBanner: false,
        ),
      ),
    );
  }
}

// ── GoRouter refresh bridge ───────────────────────────────────────────────────
class _GoRouterRefreshStream extends ChangeNotifier {
  _GoRouterRefreshStream(Stream<void> stream) {
    notifyListeners();
    _subscription = stream.listen((_) => notifyListeners());
  }

  late final StreamSubscription<void> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

// ── StreamGroup helper (avoid extra dependency) ───────────────────────────────
class StreamGroup {
  static Stream<T> merge<T>(List<Stream<T>> streams) {
    late StreamController<T> controller;
    final subs = <StreamSubscription<T>>[];
    int active = streams.length;

    controller = StreamController<T>(
      onListen: () {
        for (final s in streams) {
          subs.add(s.listen(
            controller.add,
            onError: controller.addError,
            onDone: () {
              if (--active == 0) controller.close();
            },
          ));
        }
      },
      onCancel: () {
        for (final sub in subs) {
          sub.cancel();
        }
      },
    );
    return controller.stream;
  }
}
