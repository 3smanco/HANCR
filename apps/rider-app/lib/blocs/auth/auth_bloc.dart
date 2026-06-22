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

  /// رمز مؤقّت للتحقق بخطوتين (بين verifyOtp وverifyTwoFactor).
  String? _twoFactorPendingToken;
  String? _twoFactorPhone;

  AuthBloc() : super(const AuthInitial()) {
    on<AuthCheckRequested>(_onCheck);
    on<AuthSendOtpRequested>(_onSendOtp);
    on<AuthVerifyOtpRequested>(_onVerifyOtp);
    on<AuthTwoFactorSubmitted>(_onVerifyTwoFactor);
    on<AuthSendEmailOtpRequested>(_onSendEmailOtp);
    on<AuthVerifyEmailOtpRequested>(_onVerifyEmailOtp);
    on<AuthGoogleSignInRequested>(_onGoogleSignIn);
    on<AuthLogoutRequested>(_onLogout);
  }

  /// يحفظ الحساب في قائمة الحسابات المتعددة (للتبديل لاحقاً)
  Future<void> _persistAccount(
    String token,
    Map<String, dynamic>? rider,
  ) async {
    final riderId = rider?['id'] as int? ?? 0;
    if (riderId == 0) return;
    final name = [rider?['firstName'], rider?['lastName']]
        .where((s) => s != null && (s as String).isNotEmpty)
        .join(' ');
    await StorageService.saveAccount(
      token: token,
      riderId: riderId,
      phone: rider?['phoneNumber'] as String? ?? '',
      name: name.isEmpty ? null : name,
    );
  }

  Future<void> _onCheck(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final hasToken = await StorageService.hasToken();
    if (hasToken) {
      final riderId = await StorageService.getRiderId();
      emit(AuthAuthenticated(riderId: riderId ?? 0, isNewUser: false));
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
          document: gql(sendOtpMutation),
          variables: {'phone': event.phone},
        ),
      );
      if (result.hasException) {
        final msg = result.exception?.graphqlErrors.firstOrNull?.message ??
            result.exception.toString();
        emit(AuthError(msg));
        return;
      }
      final data = result.data?['sendOtp'] as Map<String, dynamic>?;
      final success = data?['success'] as bool? ?? false;
      if (!success) {
        emit(const AuthError('Failed to send OTP. Please try again.'));
        return;
      }
      final devOtp = data?['devOtp'] as String?;
      await StorageService.savePhone(event.phone);
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
          document: gql(verifyOtpMutation),
          variables: {
            'phone': event.phone,
            'code': event.otp,
            if (event.referralCode != null && event.referralCode!.isNotEmpty)
              'referralCode': event.referralCode,
            // ربط هوية Google/الإيميل (إن جاء المستخدم من ذلك التدفّق)
            if (_pendingToken != null) 'pendingToken': _pendingToken,
          },
        ),
      );
      if (result.hasException) {
        final msg = result.exception?.graphqlErrors.firstOrNull?.message ??
            'Invalid OTP. Please try again.';
        emit(AuthError(msg));
        return;
      }
      final payload = result.data?['verifyOtp'] as Map<String, dynamic>?;
      final token = payload?['accessToken'] as String?;
      final isNewUser = payload?['isNewUser'] as bool? ?? false;
      final riderData = payload?['rider'] as Map<String, dynamic>?;
      final riderId = riderData?['id'] as int? ?? 0;

      // تحقّق بخطوتين مطلوب: لم تُصدر جلسة بعد — نطلب رمز TOTP.
      if (payload?['twoFactorRequired'] == true) {
        _twoFactorPendingToken = payload?['pendingToken'] as String?;
        _twoFactorPhone = event.phone;
        emit(AuthTwoFactorRequired(phone: event.phone));
        return;
      }

      if (token == null || token.isEmpty) {
        emit(const AuthError('Authentication failed.'));
        return;
      }

      _pendingToken = null; // استُهلك رمز الربط
      await StorageService.saveToken(token);
      await StorageService.saveRiderId(riderId);
      await _persistAccount(token, riderData);
      await GraphQLClientManager.reset(); // rebuild client with new token

      emit(AuthAuthenticated(riderId: riderId, isNewUser: isNewUser));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }

  Future<void> _onVerifyTwoFactor(
    AuthTwoFactorSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    final pending = _twoFactorPendingToken;
    if (pending == null) {
      emit(const AuthError('انتهت صلاحية جلسة التحقق. أعد الدخول.'));
      return;
    }
    emit(const AuthLoading());
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(MutationOptions(
        document: gql(verifyTwoFactorMutation),
        variables: {'pendingToken': pending, 'code': event.code},
      ));
      if (result.hasException) {
        emit(AuthError(result.exception?.graphqlErrors.firstOrNull?.message ??
            'رمز غير صحيح.'));
        // أبقِ المستخدم على شاشة التحقق
        if (_twoFactorPhone != null) {
          emit(AuthTwoFactorRequired(phone: _twoFactorPhone!));
        }
        return;
      }
      final payload = result.data?['verifyTwoFactor'] as Map<String, dynamic>?;
      final token = payload?['accessToken'] as String?;
      final riderData = payload?['rider'] as Map<String, dynamic>?;
      final riderId = riderData?['id'] as int? ?? 0;
      if (token == null || token.isEmpty) {
        emit(const AuthError('فشل الدخول.'));
        return;
      }
      _twoFactorPendingToken = null;
      _twoFactorPhone = null;
      await StorageService.saveToken(token);
      await StorageService.saveRiderId(riderId);
      await _persistAccount(token, riderData);
      await GraphQLClientManager.reset();
      emit(AuthAuthenticated(riderId: riderId, isNewUser: false));
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
        document: gql(sendEmailOtpMutation),
        variables: {'email': event.email},
      ));
      if (result.hasException) {
        emit(AuthError(result.exception?.graphqlErrors.firstOrNull?.message ??
            result.exception.toString()));
        return;
      }
      final data = result.data?['sendEmailOtp'] as Map<String, dynamic>?;
      if (data?['success'] != true) {
        emit(AuthError(data?['message'] as String? ??
            'تعذّر إرسال الرمز للبريد. حاول لاحقاً.'));
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
        document: gql(verifyEmailOtpMutation),
        variables: {
          'email': event.email,
          'code': event.otp,
          if (event.referralCode != null && event.referralCode!.isNotEmpty)
            'referralCode': event.referralCode,
        },
      ));
      if (result.hasException) {
        emit(AuthError(result.exception?.graphqlErrors.firstOrNull?.message ??
            'رمز خاطئ. حاول مجدداً.'));
        return;
      }
      await _handleAuthResult(
        result.data?['verifyEmailOtp'] as Map<String, dynamic>?,
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
        emit(const AuthError(
            'دخول Google غير مُهيّأ بعد. جرّب الهاتف أو الإيميل.'));
        return;
      }
      final googleSignIn = GoogleSignIn(
        serverClientId: serverClientId,
        scopes: const ['email', 'profile'],
      );
      await googleSignIn.signOut(); // اختيار حساب نظيف
      final account = await googleSignIn.signIn();
      if (account == null) {
        emit(const AuthUnauthenticated()); // ألغى المستخدم
        return;
      }
      final gAuth = await account.authentication;
      final idToken = gAuth.idToken;
      if (idToken == null || idToken.isEmpty) {
        emit(const AuthError('تعذّر الحصول على هوية Google. حاول لاحقاً.'));
        return;
      }
      final client = await GraphQLClientManager.get();
      final result = await client.mutate(MutationOptions(
        document: gql(googleAuthMutation),
        variables: {
          'idToken': idToken,
          if (event.referralCode != null && event.referralCode!.isNotEmpty)
            'referralCode': event.referralCode,
        },
      ));
      if (result.hasException) {
        emit(AuthError(result.exception?.graphqlErrors.firstOrNull?.message ??
            'فشل دخول Google.'));
        return;
      }
      await _handleAuthResult(
        result.data?['googleAuth'] as Map<String, dynamic>?,
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
    final riderData = data['rider'] as Map<String, dynamic>?;
    final riderId = riderData?['id'] as int? ?? 0;
    final isNewUser = data['isNewUser'] as bool? ?? false;
    _pendingToken = null;
    await StorageService.saveToken(token);
    await StorageService.saveRiderId(riderId);
    await _persistAccount(token, riderData);
    await GraphQLClientManager.reset();
    emit(AuthAuthenticated(riderId: riderId, isNewUser: isNewUser));
  }

  Future<void> _onLogout(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await StorageService.clearAll();
    await GraphQLClientManager.reset();
    emit(const AuthUnauthenticated());
  }
}
