import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/motion/motion.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraEmailScreen — دخول الكابتن بالبريد بنمط Aurora.
class AuroraEmailScreen extends StatefulWidget {
  const AuroraEmailScreen({super.key});

  @override
  State<AuroraEmailScreen> createState() => _AuroraEmailScreenState();
}

class _AuroraEmailScreenState extends State<AuroraEmailScreen> {
  final _emailCtrl = TextEditingController();

  bool get _valid {
    final e = _emailCtrl.text.trim();
    return e.contains('@') && e.contains('.') && e.length >= 6;
  }

  void _submit() {
    if (!_valid) return;
    Haptics.selection();
    context.read<AuthBloc>().add(AuthSendEmailOtpRequested(_emailCtrl.text.trim()));
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
              ctx.push('/auth/email-otp',
                  extra: {'email': state.email, 'devOtp': state.devOtp});
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
                        child: _circleButton(Icons.arrow_back,
                            () => context.canPop() ? context.pop() : context.go('/auth/phone')),
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
                          child: Icon(Icons.alternate_email,
                              color: AuroraColors.pearl, size: 36),
                        ),
                      ),
                      const SizedBox(height: AuroraSpacing.xxl),
                      Text(tr('emailTitle'),
                          textAlign: TextAlign.center,
                          style: AuroraText.displayMedium),
                      const SizedBox(height: AuroraSpacing.sm),
                      Text(tr('emailSub'),
                          textAlign: TextAlign.center,
                          style: AuroraText.bodyMedium),
                      const SizedBox(height: AuroraSpacing.huge),
                      TextField(
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        autofocus: true,
                        onChanged: (_) => setState(() {}),
                        onSubmitted: (_) => _submit(),
                        style: AuroraText.bodyLarge,
                        decoration: InputDecoration(
                          hintText: tr('emailHint'),
                          prefixIcon: const Icon(Icons.email_outlined,
                              color: AuroraColors.textHint),
                        ),
                      ),
                      const SizedBox(height: AuroraSpacing.xl),
                      AuroraButton.primary(
                        label: tr('sendCode'),
                        icon: Icons.send,
                        loading: state is AuthLoading,
                        onPressed: _valid ? _submit : null,
                      ),
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
