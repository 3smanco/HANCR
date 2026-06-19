import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraOtpScreen — تحقق من الـ OTP بنمط Aurora.
class AuroraOtpScreen extends StatefulWidget {
  final String phone;
  final String? devOtp;

  const AuroraOtpScreen({
    required this.phone,
    this.devOtp,
    super.key,
  });

  @override
  State<AuroraOtpScreen> createState() => _AuroraOtpScreenState();
}

class _AuroraOtpScreenState extends State<AuroraOtpScreen> {
  final _otpCtrl = TextEditingController();
  final _referralCtrl = TextEditingController();
  final _twoFaCtrl = TextEditingController();
  int _resendIn = 30;

  @override
  void initState() {
    super.initState();
    _tickResend();
    if (widget.devOtp != null) {
      _otpCtrl.text = widget.devOtp!;
    }
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

  void _verify(String otp) {
    if (otp.length < 4) return;
    context.read<AuthBloc>().add(
          AuthVerifyOtpRequested(
            phone: widget.phone,
            otp: otp,
            referralCode: _referralCtrl.text.trim().isEmpty
                ? null
                : _referralCtrl.text.trim().toUpperCase(),
          ),
        );
  }

  void _resend() {
    if (_resendIn > 0) return;
    context.read<AuthBloc>().add(AuthSendOtpRequested(widget.phone));
    setState(() => _resendIn = 30);
    _tickResend();
  }

  void _submitTwoFa() {
    final code = _twoFaCtrl.text.trim();
    if (code.length < 6) return;
    context.read<AuthBloc>().add(AuthTwoFactorSubmitted(code));
  }

  @override
  void dispose() {
    _otpCtrl.dispose();
    _referralCtrl.dispose();
    _twoFaCtrl.dispose();
    super.dispose();
  }

  Widget _twoFactorView(BuildContext context, AuthTwoFactorRequired state) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.xxl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: AuroraSpacing.xxl),
            Icon(Icons.verified_user, color: AuroraColors.ember, size: 56),
            const SizedBox(height: AuroraSpacing.lg),
            Text(tr('twoFactor'),
                textAlign: TextAlign.center,
                style: AuroraText.displayMedium),
            const SizedBox(height: AuroraSpacing.sm),
            Text(tr('enterAuthCode'),
                textAlign: TextAlign.center, style: AuroraText.bodyMedium),
            const SizedBox(height: AuroraSpacing.xl),
            TextField(
              controller: _twoFaCtrl,
              keyboardType: TextInputType.number,
              maxLength: 10,
              textAlign: TextAlign.center,
              autofocus: true,
              style: AuroraText.titleLarge.copyWith(
                  color: AuroraColors.pearl, letterSpacing: 4),
              decoration: const InputDecoration(
                  counterText: '', hintText: '000000'),
              onSubmitted: (_) => _submitTwoFa(),
            ),
            const SizedBox(height: AuroraSpacing.lg),
            AuroraButton.primary(
              label: tr('confirm'),
              onPressed: _submitTwoFa,
            ),
            const SizedBox(height: AuroraSpacing.md),
            TextButton(
              onPressed: () => context.go('/auth/phone'),
              child: Text(tr('cancel'),
                  style: TextStyle(color: AuroraColors.textSecondary)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        child: BlocConsumer<AuthBloc, AuthState>(
          listener: (ctx, state) {
            if (state is AuthAuthenticated) {
              context.go('/home');
            }
            if (state is AuthError) {
              ScaffoldMessenger.of(ctx).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: AuroraColors.danger,
                ),
              );
            }
          },
          builder: (context, state) {
            if (state is AuthTwoFactorRequired) {
              return _twoFactorView(context, state);
            }
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.xxl),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: AuroraSpacing.md),

                    // ─── Back button ───
                    Align(
                      alignment: Alignment.centerRight,
                      child: Container(
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
                            onTap: () => context.canPop()
                                ? context.pop()
                                : context.go('/auth/phone'),
                            customBorder: const CircleBorder(),
                            child: Icon(Icons.arrow_back,
                                color: AuroraColors.pearl, size: 20),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: AuroraSpacing.huge),

                    // ─── Hero icon ───
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        gradient: AuroraColors.emberGradient,
                        shape: BoxShape.circle,
                        boxShadow: AuroraShadows.emberGlow,
                      ),
                      child: Icon(
                        Icons.lock_outline,
                        color: AuroraColors.pearl,
                        size: 36,
                      ),
                    ),

                    const SizedBox(height: AuroraSpacing.xxl),

                    // ─── Title ───
                    Text(
                      tr('otpTitle'),
                      textAlign: TextAlign.center,
                      style: AuroraText.displayMedium,
                    ),
                    const SizedBox(height: AuroraSpacing.sm),
                    Text(
                      tr('otpSentTo'),
                      textAlign: TextAlign.center,
                      style: AuroraText.bodyMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.phone,
                      textAlign: TextAlign.center,
                      style: AuroraText.titleSmall.copyWith(
                        color: AuroraColors.ember,
                      ),
                    ),

                    const SizedBox(height: AuroraSpacing.huge),

                    // ─── PIN code field ───
                    PinCodeTextField(
                      appContext: context,
                      length: 6,
                      controller: _otpCtrl,
                      keyboardType: TextInputType.number,
                      animationType: AnimationType.fade,
                      cursorColor: AuroraColors.ember,
                      enableActiveFill: true,
                      textStyle: AuroraText.titleLarge.copyWith(
                        color: AuroraColors.pearl,
                      ),
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

                    const SizedBox(height: AuroraSpacing.lg),

                    // ─── كود إحالة اختياري (للمستخدمين الجدد) ───
                    TextField(
                      controller: _referralCtrl,
                      textCapitalization: TextCapitalization.characters,
                      textAlign: TextAlign.center,
                      style: AuroraText.bodyMedium
                          .copyWith(color: AuroraColors.pearl, letterSpacing: 2),
                      decoration: InputDecoration(
                        hintText: tr('referralCodeOptional'),
                        hintStyle: AuroraText.bodySmall
                            .copyWith(color: AuroraColors.textSecondary),
                        prefixIcon: Icon(Icons.card_giftcard,
                            color: AuroraColors.ember, size: 20),
                        filled: true,
                        fillColor: AuroraColors.ash,
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AuroraRadius.md),
                          borderSide:
                              const BorderSide(color: AuroraColors.border),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AuroraRadius.md),
                          borderSide: BorderSide(
                              color: AuroraColors.ember, width: 1.5),
                        ),
                      ),
                    ),

                    const SizedBox(height: AuroraSpacing.xl),

                    // ─── Verify button ───
                    AuroraButton.primary(
                      label: tr('verify'),
                      icon: Icons.check_circle_outline,
                      loading: state is AuthLoading,
                      onPressed: _otpCtrl.text.length >= 4
                          ? () => _verify(_otpCtrl.text)
                          : null,
                    ),

                    const SizedBox(height: AuroraSpacing.xl),

                    // ─── Resend ───
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
                      const SizedBox(height: AuroraSpacing.lg),
                      AuroraCard.glass(
                        padding: const EdgeInsets.all(AuroraSpacing.md),
                        child: Row(
                          children: [
                            const Icon(Icons.info_outline,
                                color: AuroraColors.warning, size: 18),
                            const SizedBox(width: AuroraSpacing.sm),
                            Expanded(
                              child: Text(
                                'وضع التطوير — الرمز: ${widget.devOtp}',
                                style: AuroraText.bodySmall.copyWith(
                                  color: AuroraColors.warning,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
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
