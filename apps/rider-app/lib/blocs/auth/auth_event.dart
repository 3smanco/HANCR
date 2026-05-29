import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();
  @override
  List<Object?> get props => [];
}

class AuthCheckRequested extends AuthEvent {
  const AuthCheckRequested();
}

class AuthSendOtpRequested extends AuthEvent {
  final String phone;
  const AuthSendOtpRequested(this.phone);
  @override
  List<Object?> get props => [phone];
}

class AuthVerifyOtpRequested extends AuthEvent {
  final String phone;
  final String otp;
  const AuthVerifyOtpRequested({required this.phone, required this.otp});
  @override
  List<Object?> get props => [phone, otp];
}

class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}
