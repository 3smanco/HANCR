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
  final String code;
  const AuthVerifyOtpRequested({required this.phone, required this.code});
  @override
  List<Object?> get props => [phone, code];
}

class AuthSendEmailOtpRequested extends AuthEvent {
  final String email;
  const AuthSendEmailOtpRequested(this.email);
  @override
  List<Object?> get props => [email];
}

class AuthVerifyEmailOtpRequested extends AuthEvent {
  final String email;
  final String code;
  const AuthVerifyEmailOtpRequested({required this.email, required this.code});
  @override
  List<Object?> get props => [email, code];
}

class AuthGoogleSignInRequested extends AuthEvent {
  const AuthGoogleSignInRequested();
}

class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}

/// يُبعث عند إنهاء تسجيل سائق جديد (onboarding) — يحوّل isNewDriver إلى false
/// فلا يعيد الموجّه (redirect) توجيهه إلى /onboarding بعد /home.
class AuthOnboardingCompleted extends AuthEvent {
  const AuthOnboardingCompleted();
}
