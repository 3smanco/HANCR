import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/config/app_config.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/auth_gql.dart';
import '../../core/services/storage_service.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  /// رمز ربط مؤقّت من دخول Google/الإيميل — يُمرَّر مع verifyOtp لربط الهوية.
  String? _pendingToken;

  AuthBloc() : super(const AuthInitial()) {
    on<AuthCheckRequested>(_onCheck);
    on<AuthSendOtpRequested>(_onSendOtp);
    on<AuthVerifyOtpRequested>(_onVerifyOtp);
    on<AuthSendEmailOtpRequested>(_onSendEmailOtp);
    on<AuthVerifyEmailOtpRequested>(_onVerifyEmailOtp);
    on<AuthGoogleSignInRequested>(_onGoogleSignIn);
    on<AuthLogoutRequested>(_onLogout);
    on<AuthOnboardingCompleted>(_onOnboardingCompleted);
  }

  Future<void> _onCheck(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final hasToken = await StorageService.hasToken();
    if (hasToken) {
      final id = await StorageService.getDriverId();
      emit(AuthAuthenticated(driverId: id ?? 0));
    } else {
      emit(const AuthUnauthenticated());
    }
  }

  Future<void> _onSendOtp(
    AuthSendOtpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(
        MutationOptions(
          document: gql(driverSendOtpMutation),
          variables: {'phone': event.phone},
        ),
      );
      if (result.hasException) {
        emit(AuthError(
          result.exception?.graphqlErrors.firstOrNull?.message ??
              'Failed to send OTP',
        ));
        return;
      }
      final data = result.data?['driverSendOtp'] as Map<String, dynamic>?;
      final devOtp = data?['devOtp'] as String?;
      emit(AuthOtpSent(phone: event.phone, devOtp: devOtp));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onVerifyOtp(
    AuthVerifyOtpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(
        MutationOptions(
          document: gql(driverVerifyOtpMutation),
          variables: {
            'phone': event.phone,
            'code': event.code,
            if (_pendingToken != null) 'pendingToken': _pendingToken,
          },
        ),
      );
      if (result.hasException) {
        emit(AuthError(
          result.exception?.graphqlErrors.firstOrNull?.message ??
              'Invalid code',
        ));
        return;
      }
      final payload =
          result.data?['driverVerifyOtp'] as Map<String, dynamic>?;
      if (payload == null) {
        emit(const AuthError('Unexpected response'));
        return;
      }
      final token = payload['accessToken'] as String;
      final driver = payload['driver'] as Map<String, dynamic>;
      final driverId = driver['id'] as int;
      final isNew = payload['isNewDriver'] as bool? ?? false;

      _pendingToken = null;
      await StorageService.saveToken(token);
      await StorageService.saveDriverId(driverId);
      await StorageService.savePhone(event.phone);
      await GraphQLClientManager.reset();

      emit(AuthAuthenticated(driverId: driverId, isNewDriver: isNew));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // ─── دخول الإيميل (OTP) ───
  Future<void> _onSendEmailOtp(
    AuthSendEmailOtpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(MutationOptions(
        document: gql(driverSendEmailOtpMutation),
        variables: {'email': event.email},
      ));
      if (result.hasException) {
        emit(AuthError(result.exception?.graphqlErrors.firstOrNull?.message ??
            'تعذّر إرسال الرمز'));
        return;
      }
      final data = result.data?['driverSendEmailOtp'] as Map<String, dynamic>?;
      if (data?['success'] != true) {
        emit(AuthError(data?['message'] as String? ?? 'تعذّر إرسال الرمز للبريد.'));
        return;
      }
      emit(AuthEmailOtpSent(
        email: event.email,
        devOtp: data?['devOtp'] as String?,
      ));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onVerifyEmailOtp(
    AuthVerifyEmailOtpRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(MutationOptions(
        document: gql(driverVerifyEmailOtpMutation),
        variables: {'email': event.email, 'code': event.code},
      ));
      if (result.hasException) {
        emit(AuthError(result.exception?.graphqlErrors.firstOrNull?.message ??
            'رمز خاطئ'));
        return;
      }
      await _handleAuthResult(
        result.data?['driverVerifyEmailOtp'] as Map<String, dynamic>?,
        emit,
      );
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  // ─── دخول Google ───
  Future<void> _onGoogleSignIn(
    AuthGoogleSignInRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    try {
      final serverClientId = AppConfig.googleServerClientId;
      if (serverClientId.isEmpty) {
        emit(const AuthError('دخول Google غير مُهيّأ بعد. جرّب الهاتف أو الإيميل.'));
        return;
      }
      final googleSignIn = GoogleSignIn(
        serverClientId: serverClientId,
        scopes: const ['email', 'profile'],
      );
      await googleSignIn.signOut();
      final account = await googleSignIn.signIn();
      if (account == null) {
        emit(const AuthUnauthenticated());
        return;
      }
      final gAuth = await account.authentication;
      final idToken = gAuth.idToken;
      if (idToken == null || idToken.isEmpty) {
        emit(const AuthError('تعذّر الحصول على هوية Google.'));
        return;
      }
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(MutationOptions(
        document: gql(driverGoogleAuthMutation),
        variables: {'idToken': idToken},
      ));
      if (result.hasException) {
        emit(AuthError(result.exception?.graphqlErrors.firstOrNull?.message ??
            'فشل دخول Google.'));
        return;
      }
      await _handleAuthResult(
        result.data?['driverGoogleAuth'] as Map<String, dynamic>?,
        emit,
      );
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  /// معالجة AuthResult الموحّد: دخول كامل أو needsPhone (حفظ pendingToken).
  Future<void> _handleAuthResult(
    Map<String, dynamic>? data,
    Emitter<AuthState> emit,
  ) async {
    if (data == null || data['success'] != true) {
      emit(AuthError(data?['message'] as String? ?? 'فشل الدخول.'));
      return;
    }
    if (data['needsPhone'] == true) {
      _pendingToken = data['pendingToken'] as String?;
      emit(const AuthNeedsPhone());
      return;
    }
    final token = data['accessToken'] as String?;
    if (token == null) {
      emit(const AuthError('فشل الدخول.'));
      return;
    }
    final driver = data['driver'] as Map<String, dynamic>?;
    final driverId = driver?['id'] as int? ?? 0;
    final isNew = data['isNewDriver'] as bool? ?? false;
    _pendingToken = null;
    await StorageService.saveToken(token);
    await StorageService.saveDriverId(driverId);
    await GraphQLClientManager.reset();
    emit(AuthAuthenticated(driverId: driverId, isNewDriver: isNew));
  }

  Future<void> _onLogout(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await StorageService.clearAll();
    await GraphQLClientManager.reset();
    emit(const AuthUnauthenticated());
  }

  Future<void> _onOnboardingCompleted(
    AuthOnboardingCompleted event,
    Emitter<AuthState> emit,
  ) async {
    final current = state;
    if (current is AuthAuthenticated) {
      emit(AuthAuthenticated(driverId: current.driverId, isNewDriver: false));
    }
  }
}
