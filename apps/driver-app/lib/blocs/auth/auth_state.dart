import 'package:equatable/equatable.dart';

abstract class AuthState extends Equatable {
  const AuthState();
  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthOtpSent extends AuthState {
  final String phone;
  final String? devOtp;
  const AuthOtpSent({required this.phone, this.devOtp});
  @override
  List<Object?> get props => [phone, devOtp];
}

class AuthEmailOtpSent extends AuthState {
  final String email;
  final String? devOtp;
  const AuthEmailOtpSent({required this.email, this.devOtp});
  @override
  List<Object?> get props => [email, devOtp];
}

/// دخول Google/الإيميل نجح لكن يحتاج ربط هاتف (pendingToken محفوظ في البلوك)
class AuthNeedsPhone extends AuthState {
  const AuthNeedsPhone();
}

class AuthAuthenticated extends AuthState {
  final int driverId;
  final bool isNewDriver;
  const AuthAuthenticated({required this.driverId, this.isNewDriver = false});
  @override
  List<Object?> get props => [driverId, isNewDriver];
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);
  @override
  List<Object?> get props => [message];
}
