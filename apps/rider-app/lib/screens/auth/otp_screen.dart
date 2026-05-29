import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';
import '../../core/theme/app_theme.dart';

class OtpScreen extends StatefulWidget {
  final String phone;
  final String? devOtp;

  const OtpScreen({super.key, required this.phone, this.devOtp});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _otpCtrl = TextEditingController();
  int _secondsLeft = 30;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
    // In dev mode: auto-fill the OTP
    if (widget.devOtp != null) {
      Future.delayed(const Duration(milliseconds: 400), () {
        if (mounted) _otpCtrl.text = widget.devOtp!;
      });
    }
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() => _secondsLeft = 30);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsLeft <= 1) {
        t.cancel();
        setState(() => _secondsLeft = 0);
      } else {
        setState(() => _secondsLeft--);
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpCtrl.dispose();
    super.dispose();
  }

  void _verify(String otp) {
    if (otp.length < 6) return;
    context.read<AuthBloc>().add(
          AuthVerifyOtpRequested(phone: widget.phone, otp: otp),
        );
  }

  void _resend() {
    context.read<AuthBloc>().add(AuthSendOtpRequested(widget.phone));
    _startTimer();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (ctx, state) {
        if (state is AuthAuthenticated) {
          ctx.go('/home');
        } else if (state is AuthError) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            SnackBar(content: Text(state.message)),
          );
        } else if (state is AuthOtpSent) {
          // Resent
          _startTimer();
          ScaffoldMessenger.of(ctx).showSnackBar(
            const SnackBar(content: Text('OTP resent')),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(
          leading: BackButton(onPressed: () => context.pop()),
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 24),
                Text(
                  'Verify your\nnumber',
                  style: Theme.of(context).textTheme.displayMedium,
                ),
                const SizedBox(height: 10),
                RichText(
                  text: TextSpan(
                    style: Theme.of(context).textTheme.bodyMedium,
                    children: [
                      const TextSpan(text: 'Code sent to '),
                      TextSpan(
                        text: widget.phone,
                        style: const TextStyle(
                          color: HancrColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                if (widget.devOtp != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: HancrColors.accent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'ðŸ”‘ Dev OTP: ${widget.devOtp}',
                      style: const TextStyle(
                        color: HancrColors.accent,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 40),
                // PIN field
                PinCodeTextField(
                  appContext: context,
                  controller: _otpCtrl,
                  length: 6,
                  keyboardType: TextInputType.number,
                  animationType: AnimationType.scale,
                  autoFocus: true,
                  pinTheme: PinTheme(
                    shape: PinCodeFieldShape.box,
                    borderRadius: BorderRadius.circular(12),
                    fieldHeight: 58,
                    fieldWidth: 48,
                    activeFillColor: HancrColors.surface,
                    inactiveFillColor: HancrColors.surfaceVariant,
                    selectedFillColor: HancrColors.surface,
                    activeColor: HancrColors.primary,
                    inactiveColor: Colors.transparent,
                    selectedColor: HancrColors.primary,
                  ),
                  enableActiveFill: true,
                  onCompleted: _verify,
                  onChanged: (_) {},
                ),
                const SizedBox(height: 24),
                // Resend
                Center(
                  child: _secondsLeft > 0
                      ? Text(
                          'Resend code in $_secondsLeft s',
                          style: Theme.of(context).textTheme.bodyMedium,
                        )
                      : TextButton(
                          onPressed: _resend,
                          child: const Text(
                            'Resend code',
                            style: TextStyle(
                              color: HancrColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                ),
                const Spacer(),
                // Verify button
                BlocBuilder<AuthBloc, AuthState>(
                  builder: (ctx, state) {
                    final loading = state is AuthLoading;
                    return ElevatedButton(
                      onPressed: loading
                          ? null
                          : () => _verify(_otpCtrl.text),
                      child: loading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Verify'),
                    );
                  },
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
