import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/auth_gql.dart';
import '../../core/services/storage_service.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc() : super(const AuthInitial()) {
    on<AuthCheckRequested>(_onCheck);
    on<AuthSendOtpRequested>(_onSendOtp);
    on<AuthVerifyOtpRequested>(_onVerifyOtp);
    on<AuthLogoutRequested>(_onLogout);
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
          variables: {'phone': event.phone, 'code': event.otp},
        ),
      );
      if (result.hasException) {
        final msg = result.exception?.graphqlErrors.firstOrNull?.message ??
            'Invalid OTP. Please try again.';
        emit(AuthError(msg));
        return;
      }
      final payload =
          result.data?['verifyOtp'] as Map<String, dynamic>?;
      final token = payload?['accessToken'] as String?;
      final isNewUser = payload?['isNewUser'] as bool? ?? false;
      final riderData = payload?['rider'] as Map<String, dynamic>?;
      final riderId = riderData?['id'] as int? ?? 0;

      if (token == null) {
        emit(const AuthError('Authentication failed.'));
        return;
      }

      await StorageService.saveToken(token);
      await StorageService.saveRiderId(riderId);
      await GraphQLClientManager.reset(); // rebuild client with new token

      emit(AuthAuthenticated(riderId: riderId, isNewUser: isNewUser));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
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
