import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_state.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/services/storage_service.dart';
import '../../core/widgets/aurora/aurora.dart';

/// طرق تسجيل الدخول — الهاتف (أساسي) · Google (ربط حقيقي) · البيومترية (محلي)
/// · Apple/X (قريباً).
class LoginMethodsScreen extends StatefulWidget {
  const LoginMethodsScreen({super.key});

  @override
  State<LoginMethodsScreen> createState() => _LoginMethodsScreenState();
}

class _LoginMethodsScreenState extends State<LoginMethodsScreen> {
  bool _biometric = false;

  @override
  void initState() {
    super.initState();
    StorageService.getBiometric().then((v) {
      if (mounted) setState(() => _biometric = v);
    });
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: AuroraColors.smoke,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('loginMethods'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: BlocBuilder<RiderBloc, RiderState>(
            builder: (context, state) {
              final rider = state is RiderLoaded ? state.rider : null;
              final phone = rider?.phoneNumber ?? '';
              final googleLinked = rider?.googleLinked ?? false;
              return ListView(
                padding: const EdgeInsets.all(AuroraSpacing.lg),
                children: [
                  // الهاتف — أساسي، موثَّق
                  _tile(
                    icon: Icons.phone_android,
                    title: tr('signInPhone'),
                    subtitle: phone.isEmpty ? tr('signInPhone') : phone,
                    trailing: _badge(tr('verified'), AuroraColors.success),
                  ),
                  // Google
                  _tile(
                    icon: Icons.g_mobiledata,
                    title: 'Google',
                    subtitle: googleLinked ? tr('linked') : tr('notLinked'),
                    trailing: googleLinked
                        ? _badge(tr('linked'), AuroraColors.ember)
                        : TextButton(
                            onPressed: () => context
                                .read<AuthBloc>()
                                .add(const AuthGoogleSignInRequested()),
                            child: Text(tr('link'),
                                style: TextStyle(color: AuroraColors.ember)),
                          ),
                  ),
                  // البيومترية — محلي
                  Container(
                    margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
                    padding: const EdgeInsets.symmetric(
                        horizontal: AuroraSpacing.lg, vertical: 4),
                    decoration: BoxDecoration(
                      color: AuroraColors.ash,
                      borderRadius: BorderRadius.circular(AuroraRadius.md),
                      border: Border.all(color: AuroraColors.border),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.fingerprint,
                            color: AuroraColors.ember, size: 22),
                        const SizedBox(width: AuroraSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(tr('biometric'),
                                  style: AuroraText.bodyMedium
                                      .copyWith(color: AuroraColors.pearl)),
                              Text(tr('biometricSub'),
                                  style: AuroraText.caption),
                            ],
                          ),
                        ),
                        Switch(
                          value: _biometric,
                          activeThumbColor: AuroraColors.ember,
                          onChanged: (v) async {
                            setState(() => _biometric = v);
                            await StorageService.saveBiometric(v);
                          },
                        ),
                      ],
                    ),
                  ),
                  // Apple / X — قريباً
                  _tile(
                    icon: Icons.apple,
                    title: 'Apple',
                    subtitle: tr('comingSoon'),
                    trailing: null,
                    onTap: () => _toast('Apple — ${tr('comingSoon')}'),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(AuroraRadius.pill),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Text(text, style: AuroraText.caption.copyWith(color: color)),
    );
  }

  Widget _tile({
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: ListTile(
        leading: Icon(icon, color: AuroraColors.ember),
        title: Text(title,
            style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl)),
        subtitle: Text(subtitle, style: AuroraText.caption),
        trailing: trailing,
        onTap: onTap,
      ),
    );
  }
}
