import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';
import 'core/i18n/app_localization.dart';
import 'blocs/auth/auth_bloc.dart';
import 'blocs/auth/auth_event.dart';
import 'blocs/auth/auth_state.dart';
import 'blocs/driver/driver_bloc.dart';
import 'blocs/driver/driver_event.dart';
import 'blocs/location/location_bloc.dart';
import 'blocs/order/order_bloc.dart';
import 'blocs/order/order_event.dart';
import 'blocs/order/order_state.dart';
import 'core/router/app_router.dart';
import 'core/services/push_service.dart';
import 'core/theme/aurora_theme.dart';
import 'screens/auth/otp_screen.dart';
import 'screens/auth/phone_screen.dart';
import 'screens/home/aurora_driver_home.dart';
import 'screens/onboarding/onboarding_screen.dart';
import 'screens/splash/splash_screen.dart';

class HancrCaptainApp extends StatefulWidget {
  const HancrCaptainApp({super.key});

  @override
  State<HancrCaptainApp> createState() => _HancrCaptainAppState();
}

class _HancrCaptainAppState extends State<HancrCaptainApp> {
  late final AuthBloc _authBloc;
  late final OrderBloc _orderBloc;
  late final DriverBloc _driverBloc;
  late final LocationBloc _locationBloc;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authBloc = AuthBloc()..add(const AuthCheckRequested());
    _orderBloc = OrderBloc();
    _driverBloc = DriverBloc();
    _locationBloc = LocationBloc();
    _router = _buildRouter();
  }

  GoRouter _buildRouter() {
    return GoRouter(
      navigatorKey: rootNavigatorKey,
      initialLocation: '/splash',
      refreshListenable: _GoRouterRefreshStream(
        _StreamGroup.merge<void>([
          _authBloc.stream.map<void>((_) {}),
          _orderBloc.stream.map<void>((_) {}),
        ]),
      ),
      redirect: (context, state) {
        final auth = _authBloc.state;
        final order = _orderBloc.state;
        final loc = state.matchedLocation;

        if (auth is AuthLoading || auth is AuthInitial) {
          return loc == '/splash' ? null : '/splash';
        }
        if (auth is AuthUnauthenticated || auth is AuthError) {
          if (loc.startsWith('/auth')) return null;
          return '/auth/phone';
        }
        if (auth is AuthAuthenticated) {
          if (auth.isNewDriver && loc != '/onboarding') return '/onboarding';
          if (loc == '/splash' || loc.startsWith('/auth') ||
              loc == '/onboarding') {
            return '/home';
          }
          if (order is OrderIncoming && loc != '/home') return '/home';
        }
        return null;
      },
      routes: [
        GoRoute(path: '/splash', builder: (ctx, st) => const SplashScreen()),
        GoRoute(path: '/auth/phone', builder: (ctx, st) => const PhoneScreen()),
        GoRoute(
          path: '/auth/otp',
          builder: (_, state) {
            final extra = state.extra as Map<String, dynamic>?;
            return OtpScreen(
              phone: extra?['phone'] as String? ?? '',
              devOtp: extra?['devOtp'] as String?,
            );
          },
        ),
        GoRoute(path: '/onboarding', builder: (ctx, st) => const OnboardingScreen()),
        GoRoute(path: '/home', builder: (ctx, st) => const AuroraDriverHome()),
      ],
    );
  }

  @override
  void dispose() {
    _authBloc.close();
    _orderBloc.close();
    _driverBloc.close();
    _locationBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _authBloc),
        BlocProvider.value(value: _orderBloc),
        BlocProvider.value(value: _driverBloc),
        BlocProvider.value(value: _locationBloc),
      ],
      child: BlocListener<AuthBloc, AuthState>(
        bloc: _authBloc,
        listener: (ctx, state) {
          if (state is AuthAuthenticated) {
            _driverBloc.add(const DriverLoadRequested());
            _orderBloc.add(const OrderCheckActiveRequested());
            _orderBloc.add(const OrderSubscriptionStartRequested());
            // Register FCM token with driver-api (fire-and-forget)
            PushService.instance.registerWithBackend();
          }
        },
        child: ValueListenableBuilder<Locale>(
          valueListenable: LocaleController.instance,
          builder: (context, locale, _) {
            return MaterialApp.router(
              title: 'HANCR Captain',
              theme: AuroraTheme.dark,
              darkTheme: AuroraTheme.dark,
              themeMode: ThemeMode.dark,
              routerConfig: _router,
              debugShowCheckedModeBanner: false,
              locale: locale,
              supportedLocales: kSupportedLocales,
              localizationsDelegates: const [
                GlobalMaterialLocalizations.delegate,
                GlobalWidgetsLocalizations.delegate,
                GlobalCupertinoLocalizations.delegate,
              ],
            );
          },
        ),
      ),
    );
  }
}

// ── GoRouter refresh bridge ───────────────────────────────────────────────────
class _GoRouterRefreshStream extends ChangeNotifier {
  _GoRouterRefreshStream(Stream<void> stream) {
    notifyListeners();
    _sub = stream.listen((_) => notifyListeners());
  }
  late final StreamSubscription<void> _sub;
  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}

// ── Stream merge helper ───────────────────────────────────────────────────────
class _StreamGroup {
  static Stream<T> merge<T>(List<Stream<T>> streams) {
    late StreamController<T> ctrl;
    final subs = <StreamSubscription<T>>[];
    int active = streams.length;
    ctrl = StreamController<T>(
      onListen: () {
        for (final s in streams) {
          subs.add(s.listen(
            ctrl.add,
            onError: ctrl.addError,
            onDone: () { if (--active == 0) ctrl.close(); },
          ));
        }
      },
      onCancel: () {
        for (final sub in subs) {
          sub.cancel();
        }
      },
    );
    return ctrl.stream;
  }
}
