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
  final String? referralCode;
  const AuthVerifyOtpRequested({
    required this.phone,
    required this.otp,
    this.referralCode,
  });
  @override
  List<Object?> get props => [phone, otp, referralCode];
}

/// إكمال الدخول بإدخال رمز التحقق بخطوتين (TOTP أو كود استرداد)
class AuthTwoFactorSubmitted extends AuthEvent {
  final String code;
  const AuthTwoFactorSubmitted(this.code);
  @override
  List<Object?> get props => [code];
}

/// طلب رمز OTP إلى البريد الإلكتروني
class AuthSendEmailOtpRequested extends AuthEvent {
  final String email;
  const AuthSendEmailOtpRequested(this.email);
  @override
  List<Object?> get props => [email];
}

/// التحقق من OTP البريد
class AuthVerifyEmailOtpRequested extends AuthEvent {
  final String email;
  final String otp;
  final String? referralCode;
  const AuthVerifyEmailOtpRequested({
    required this.email,
    required this.otp,
    this.referralCode,
  });
  @override
  List<Object?> get props => [email, otp, referralCode];
}

/// الدخول عبر حساب Google (يبدأ تدفّق google_sign_in)
class AuthGoogleSignInRequested extends AuthEvent {
  final String? referralCode;
  const AuthGoogleSignInRequested({this.referralCode});
  @override
  List<Object?> get props => [referralCode];
}

class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}
