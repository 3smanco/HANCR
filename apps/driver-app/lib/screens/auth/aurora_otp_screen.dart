import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/motion/motion.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraOtpScreen — تحقّق رمز دخول الكابتن بنمط Aurora.
class AuroraOtpScreen extends StatefulWidget {
  final String phone;
  final String? devOtp;
  const AuroraOtpScreen({required this.phone, this.devOtp, super.key});

  @override
  State<AuroraOtpScreen> createState() => _AuroraOtpScreenState();
}

class _AuroraOtpScreenState extends State<AuroraOtpScreen> {
  final _otpCtrl = TextEditingController();
  int _resendIn = 30;

  @override
  void initState() {
    super.initState();
    _tickResend();
    if (widget.devOtp != null) _otpCtrl.text = widget.devOtp!;
  }

  void _tickResend() {
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      if (_resendIn > 0) {
        setState(() => _resendIn--);
        _tickResend();
      }
    });
  }

  void _verify(String code) {
    if (code.length < 6) return;
    Haptics.selection();
    context
        .read<AuthBloc>()
        .add(AuthVerifyOtpRequested(phone: widget.phone, code: code));
  }

  void _resend() {
    if (_resendIn > 0) return;
    context.read<AuthBloc>().add(AuthSendOtpRequested(widget.phone));
    setState(() => _resendIn = 30);
    _tickResend();
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
            if (state is AuthAuthenticated) {
              Haptics.success();
              ctx.go('/home');
            }
            if (state is AuthError) {
              Haptics.error();
              ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
                content: Text(state.message),
                backgroundColor: AuroraColors.danger,
              ));
            }
          },
          builder: (context, state) {
            return SafeArea(
              child: SingleChildScrollView(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: AuroraSpacing.xxl),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const SizedBox(height: AuroraSpacing.md),
                      Align(
                        alignment: AlignmentDirectional.centerStart,
                        child: _circleButton(
                          Icons.arrow_back,
                          () => context.canPop()
                              ? context.pop()
                              : context.go('/auth/phone'),
                        ),
                      ),
                      const SizedBox(height: AuroraSpacing.huge),
                      Center(
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            gradient: AuroraColors.emberGradient,
                            shape: BoxShape.circle,
                            boxShadow: AuroraShadows.emberGlow,
                          ),
                          child: Icon(Icons.sms_outlined,
                              color: AuroraColors.pearl, size: 36),
                        ),
                      ),
                      const SizedBox(height: AuroraSpacing.xxl),
                      Text(tr('otpTitle'),
                          textAlign: TextAlign.center,
                          style: AuroraText.displayMedium),
                      const SizedBox(height: AuroraSpacing.sm),
                      Text(tr('otpSentTo'),
                          textAlign: TextAlign.center,
                          style: AuroraText.bodyMedium),
                      const SizedBox(height: 4),
                      Text(widget.phone,
                          textAlign: TextAlign.center,
                          style: AuroraText.titleSmall
                              .copyWith(color: AuroraColors.ember)),
                      const SizedBox(height: AuroraSpacing.huge),
                      Directionality(
                        textDirection: TextDirection.ltr,
                        child: PinCodeTextField(
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
                            borderRadius:
                                BorderRadius.circular(AuroraRadius.md),
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
                          onChanged: (_) => setState(() {}),
                        ),
                      ),
                      const SizedBox(height: AuroraSpacing.xl),
                      AuroraButton.primary(
                        label: tr('verifyBtn'),
                        icon: Icons.check_circle_outline,
                        loading: state is AuthLoading,
                        onPressed: _otpCtrl.text.length >= 6
                            ? () => _verify(_otpCtrl.text)
                            : null,
                      ),
                      const SizedBox(height: AuroraSpacing.lg),
                      Center(
                        child: TextButton(
                          onPressed: _resendIn == 0 ? _resend : null,
                          child: Text(
                            _resendIn == 0
                                ? tr('resendCode')
                                : '${tr('resendInPrefix')} $_resendIn ${tr('seconds')}',
                            style: AuroraText.bodyMedium.copyWith(
                              color: _resendIn == 0
                                  ? AuroraColors.ember
                                  : AuroraColors.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      if (widget.devOtp != null) ...[
                        const SizedBox(height: AuroraSpacing.md),
                        AuroraCard.glass(
                          padding: const EdgeInsets.all(AuroraSpacing.md),
                          child: Row(
                            children: [
                              const Icon(Icons.info_outline,
                                  color: AuroraColors.warning, size: 18),
                              const SizedBox(width: AuroraSpacing.sm),
                              Expanded(
                                child: Text(
                                  '${tr('devModeCode')}: ${widget.devOtp}',
                                  style: AuroraText.bodySmall
                                      .copyWith(color: AuroraColors.warning),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: AuroraSpacing.xl),
                    ],
                  ).animate().fadeIn(duration: Motion.base),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _circleButton(IconData icon, VoidCallback onTap) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        shape: BoxShape.circle,
        border: Border.all(color: AuroraColors.border),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: Icon(icon, color: AuroraColors.pearl, size: 20),
        ),
      ),
    );
  }
}
