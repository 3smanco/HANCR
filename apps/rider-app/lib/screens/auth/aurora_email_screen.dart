import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraEmailScreen — إدخال البريد لإرسال رمز OTP.
class AuroraEmailScreen extends StatefulWidget {
  const AuroraEmailScreen({super.key});

  @override
  State<AuroraEmailScreen> createState() => _AuroraEmailScreenState();
}

class _AuroraEmailScreenState extends State<AuroraEmailScreen> {
  final _emailCtrl = TextEditingController();

  bool get _valid {
    final t = _emailCtrl.text.trim();
    return t.contains('@') && t.contains('.') && t.length >= 6;
  }

  void _submit() {
    if (!_valid) return;
    context
        .read<AuthBloc>()
        .add(AuthSendEmailOtpRequested(_emailCtrl.text.trim().toLowerCase()));
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        child: BlocConsumer<AuthBloc, AuthState>(
          listener: (ctx, state) {
            if (state is AuthEmailOtpSent) {
              ctx.push('/auth/email-otp', extra: {
                'email': state.email,
                'devOtp': state.devOtp,
              });
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
                            : context.go('/auth/phone'),
                        icon: Icon(Icons.arrow_back,
                            color: AuroraColors.pearl),
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
                      child: Icon(Icons.alternate_email,
                          color: AuroraColors.pearl, size: 36),
                    ),
                    const SizedBox(height: AuroraSpacing.xxl),
                    Text(tr('emailLoginTitle'),
                        textAlign: TextAlign.center,
                        style: AuroraText.displayMedium),
                    const SizedBox(height: AuroraSpacing.sm),
                    Text(tr('emailLoginSub'),
                        textAlign: TextAlign.center,
                        style: AuroraText.bodyMedium),
                    const SizedBox(height: AuroraSpacing.huge),
                    TextField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      autocorrect: false,
                      onChanged: (_) => setState(() {}),
                      style: AuroraText.bodyLarge,
                      decoration: InputDecoration(
                        hintText: 'name@example.com',
                        prefixIcon: Icon(Icons.email_outlined,
                            color: AuroraColors.textHint),
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
                    AuroraButton.primary(
                      label: tr('sendCode'),
                      icon: Icons.send,
                      loading: state is AuthLoading,
                      onPressed: _valid ? _submit : null,
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
