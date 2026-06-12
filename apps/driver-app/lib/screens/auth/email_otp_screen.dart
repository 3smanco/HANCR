import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';
import '../../core/theme/app_theme.dart';

/// EmailOtpScreen — التحقق من رمز البريد (تطبيق السائق).
class EmailOtpScreen extends StatefulWidget {
  final String email;
  final String? devOtp;
  const EmailOtpScreen({required this.email, this.devOtp, super.key});
  @override
  State<EmailOtpScreen> createState() => _EmailOtpScreenState();
}

class _EmailOtpScreenState extends State<EmailOtpScreen> {
  final _ctrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.devOtp != null) _ctrl.text = widget.devOtp!;
  }

  void _verify(String code) {
    if (code.length < 4) return;
    context
        .read<AuthBloc>()
        .add(AuthVerifyEmailOtpRequested(email: widget.email, code: code));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (ctx, state) {
        if (state is AuthNeedsPhone) {
          ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(
              content: Text('أضف رقم هاتفك لإكمال إنشاء الحساب')));
          ctx.go('/auth/phone');
        }
        if (state is AuthError) {
          ScaffoldMessenger.of(ctx)
              .showSnackBar(SnackBar(content: Text(state.message)));
        }
        // AuthAuthenticated → الراوتر يحوّل تلقائياً (refreshListenable)
      },
      builder: (ctx, state) {
        final loading = state is AuthLoading;
        return Scaffold(
          backgroundColor: HancrColors.background,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () =>
                  ctx.canPop() ? ctx.pop() : ctx.go('/auth/email'),
            ),
          ),
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 16),
                  Text('رمز التحقق',
                      style: Theme.of(context).textTheme.headlineLarge),
                  const SizedBox(height: 8),
                  Text(widget.email,
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(color: HancrColors.primary)),
                  const SizedBox(height: 32),
                  PinCodeTextField(
                    appContext: context,
                    length: 6,
                    controller: _ctrl,
                    keyboardType: TextInputType.number,
                    animationType: AnimationType.fade,
                    cursorColor: HancrColors.primary,
                    enableActiveFill: true,
                    pinTheme: PinTheme(
                      shape: PinCodeFieldShape.box,
                      borderRadius: BorderRadius.circular(12),
                      fieldHeight: 56,
                      fieldWidth: 46,
                      activeColor: HancrColors.primary,
                      selectedColor: HancrColors.primary,
                      inactiveColor: HancrColors.surfaceVariant,
                      activeFillColor: HancrColors.surface,
                      selectedFillColor: HancrColors.surface,
                      inactiveFillColor: HancrColors.surface,
                    ),
                    onCompleted: _verify,
                    onChanged: (_) {},
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: (loading || _ctrl.text.length < 4)
                        ? null
                        : () => _verify(_ctrl.text),
                    child: loading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : const Text('تحقّق'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
