import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';
import '../../core/theme/app_theme.dart';
import '../../core/i18n/app_localization.dart';

class OtpScreen extends StatefulWidget {
  final String phone;
  final String? devOtp;
  const OtpScreen({super.key, required this.phone, this.devOtp});
  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _ctrl = TextEditingController();
  int _seconds = 30;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
    // Dev mode auto-fill
    if (widget.devOtp != null) {
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) _ctrl.text = widget.devOtp!;
      });
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_seconds > 0) {
        setState(() => _seconds--);
      } else {
        _timer?.cancel();
      }
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _verify(String code) {
    if (code.length != 6) return;
    context.read<AuthBloc>().add(
          AuthVerifyOtpRequested(phone: widget.phone, code: code),
        );
  }

  void _resend() {
    if (_seconds > 0) return;
    context.read<AuthBloc>().add(AuthSendOtpRequested(widget.phone));
    setState(() => _seconds = 30);
    _startTimer();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (ctx, state) {
        if (state is AuthError) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            SnackBar(content: Text(state.message)),
          );
        }
      },
      builder: (ctx, state) {
        final loading = state is AuthLoading;
        return Scaffold(
          backgroundColor: HancrColors.background,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            foregroundColor: HancrColors.primary,
          ),
          body: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Enter OTP',
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  'Sent to ${widget.phone}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 32),
                PinCodeTextField(
                  appContext: context,
                  length: 6,
                  controller: _ctrl,
                  autoFocus: true,
                  keyboardType: TextInputType.number,
                  onCompleted: _verify,
                  onChanged: (_) {},
                  pinTheme: PinTheme(
                    shape: PinCodeFieldShape.box,
                    borderRadius: BorderRadius.circular(12),
                    fieldHeight: 56,
                    fieldWidth: 46,
                    activeFillColor: Colors.white,
                    inactiveFillColor: HancrColors.surfaceVariant,
                    selectedFillColor: Colors.white,
                    activeColor: HancrColors.primary,
                    inactiveColor: HancrColors.divider,
                    selectedColor: HancrColors.primary,
                  ),
                  enableActiveFill: true,
                ),
                const SizedBox(height: 24),
                if (loading)
                  const Center(child: CircularProgressIndicator())
                else ...[
                  ElevatedButton(
                    onPressed: _ctrl.text.length == 6
                        ? () => _verify(_ctrl.text)
                        : null,
                    child: Text(tr('verify')),
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: _seconds > 0
                        ? Text(
                            'Resend in $_seconds s',
                            style: Theme.of(context).textTheme.bodyMedium,
                          )
                        : TextButton(
                            onPressed: _resend,
                            child: Text(tr('resendOtp')),
                          ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}
