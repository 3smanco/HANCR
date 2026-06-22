import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraEmailOtpScreen — التحقق من رمز البريد.
class AuroraEmailOtpScreen extends StatefulWidget {
  final String email;
  final String? devOtp;
  const AuroraEmailOtpScreen({required this.email, this.devOtp, super.key});

  @override
  State<AuroraEmailOtpScreen> createState() => _AuroraEmailOtpScreenState();
}

class _AuroraEmailOtpScreenState extends State<AuroraEmailOtpScreen> {
  final _otpCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.devOtp != null) _otpCtrl.text = widget.devOtp!;
  }

  void _verify(String otp) {
    if (otp.length < 4) return;
    context.read<AuthBloc>().add(
          AuthVerifyEmailOtpRequested(email: widget.email, otp: otp),
        );
  }

  @override
  void dispose() {
    _otpCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        child: BlocConsumer<AuthBloc, AuthState>(
          listener: (ctx, state) {
            if (state is AuthNeedsPhone) {
              // الإيميل تحقّق — أكمل بربط هاتف
              ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
                content: Text(tr('addPhoneToComplete')),
                backgroundColor: AuroraColors.smoke,
              ));
              ctx.go('/auth/phone');
            }
            if (state is AuthAuthenticated) {
              ctx.go('/home');
            }
            if (state is AuthError) {
              ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
                content: Text(state.message),
                backgroundColor: AuroraColors.danger,
              ));
            }
          },
          builder: (context, state) {
            return SafeArea(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: AuroraSpacing.xxl),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: AuroraSpacing.md),
                    Align(
                      alignment: Alignment.centerRight,
                      child: IconButton(
                        onPressed: () => context.canPop()
                            ? context.pop()
                            : context.go('/auth/email'),
                        icon: Icon(Icons.arrow_back, color: AuroraColors.pearl),
                      ),
                    ),
                    const SizedBox(height: AuroraSpacing.huge),
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        gradient: AuroraColors.emberGradient,
                        shape: BoxShape.circle,
                        boxShadow: AuroraShadows.emberGlow,
                      ),
                      child: Icon(Icons.mark_email_read_outlined,
                          color: AuroraColors.pearl, size: 36),
                    ),
                    const SizedBox(height: AuroraSpacing.xxl),
                    Text(tr('otpTitle'),
                        textAlign: TextAlign.center,
                        style: AuroraText.displayMedium),
                    const SizedBox(height: AuroraSpacing.sm),
                    Text(widget.email,
                        textAlign: TextAlign.center,
                        style: AuroraText.titleSmall
                            .copyWith(color: AuroraColors.ember)),
                    const SizedBox(height: AuroraSpacing.huge),
                    PinCodeTextField(
                      appContext: context,
                      length: 6,
                      controller: _otpCtrl,
                      keyboardType: TextInputType.number,
                      animationType: AnimationType.fade,
                      cursorColor: AuroraColors.ember,
                      enableActiveFill: true,
                      textStyle: AuroraText.titleLarge
                          .copyWith(color: AuroraColors.pearl),
                      pinTheme: PinTheme(
                        shape: PinCodeFieldShape.box,
                        borderRadius: BorderRadius.circular(AuroraRadius.md),
                        fieldHeight: 56,
                        fieldWidth: 48,
                        activeColor: AuroraColors.ember,
                        selectedColor: AuroraColors.ember,
                        inactiveColor: AuroraColors.border,
                        activeFillColor: AuroraColors.smoke,
                        selectedFillColor: AuroraColors.smoke,
                        inactiveFillColor: AuroraColors.ash,
                        borderWidth: 1.5,
                      ),
                      onCompleted: _verify,
                      onChanged: (_) {},
                    ),
                    const SizedBox(height: AuroraSpacing.xl),
                    AuroraButton.primary(
                      label: tr('verify'),
                      icon: Icons.check_circle_outline,
                      loading: state is AuthLoading,
                      onPressed: _otpCtrl.text.length >= 4
                          ? () => _verify(_otpCtrl.text)
                          : null,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
