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
          variables: {'phone': event.phone, 'code': event.code},
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

      await StorageService.saveToken(token);
      await StorageService.saveDriverId(driverId);
      await StorageService.savePhone(event.phone);
      await GraphQLClientManager.reset();

      emit(AuthAuthenticated(driverId: driverId, isNewDriver: isNew));
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
