import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraPhoneScreen — شاشة تسجيل الدخول بالنمط الجديد.
///
/// مستوحى من الصور:
///  - HANCR logo في الأعلى + "Log-in / Sign-up"
///  - عنوان كبير "Smart Mobility, Reimagined"
///  - 3D illustration (سيارة فاخرة)
///  - زر primary "Sign-up with Phone Number" مع orange glow
///  - Social login buttons (Google + Apple + X)
class AuroraPhoneScreen extends StatefulWidget {
  const AuroraPhoneScreen({super.key});

  @override
  State<AuroraPhoneScreen> createState() => _AuroraPhoneScreenState();
}

class _AuroraPhoneScreenState extends State<AuroraPhoneScreen> {
  bool _expanded = false;
  final _phoneCtrl = TextEditingController();
  String _dialCode = '+966';

  final _countries = const [
    (code: '+966', flag: '🇸🇦', name: 'Saudi Arabia'),
    (code: '+971', flag: '🇦🇪', name: 'UAE'),
    (code: '+974', flag: '🇶🇦', name: 'Qatar'),
    (code: '+965', flag: '🇰🇼', name: 'Kuwait'),
    (code: '+973', flag: '🇧🇭', name: 'Bahrain'),
    (code: '+968', flag: '🇴🇲', name: 'Oman'),
    (code: '+20', flag: '🇪🇬', name: 'Egypt'),
  ];

  @override
  void dispose() {
    _phoneCtrl.dispose();
    super.dispose();
  }

  bool get _canSubmit => _phoneCtrl.text.trim().length >= 6;

  void _submit() {
    if (!_canSubmit) return;
    final phone = '$_dialCode${_phoneCtrl.text.trim()}';
    context.read<AuthBloc>().add(AuthSendOtpRequested(phone));
    context.go('/auth/otp', extra: phone);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        showBottomHalo: true,
        child: BlocConsumer<AuthBloc, AuthState>(
          listener: (ctx, state) {
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
            return SafeArea(
              child: SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: MediaQuery.of(context).size.height -
                        MediaQuery.of(context).padding.top -
                        MediaQuery.of(context).padding.bottom,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AuroraSpacing.xxl),
                    child: Column(
                      children: [
                        // ─── HANCR Brand Header ───
                        const SizedBox(height: AuroraSpacing.xl),
                        _buildHeader(),

                        // ─── Hero Title ───
                        const SizedBox(height: AuroraSpacing.huge),
                        _buildHero(),

                        // ─── 3D Car Illustration placeholder ───
                        const SizedBox(height: AuroraSpacing.xxl),
                        _buildCarIllustration(),

                        const Spacer(),

                        // ─── Continue Using label ───
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: AuroraSpacing.lg,
                              vertical: AuroraSpacing.sm),
                          decoration: BoxDecoration(
                            color: AuroraColors.ash,
                            borderRadius:
                                BorderRadius.circular(AuroraRadius.pill),
                            border: Border.all(color: AuroraColors.border),
                          ),
                          child: Text(
                            'تابع باستخدام:',
                            style: AuroraText.bodyMedium.copyWith(
                              color: AuroraColors.textPrimary,
                            ),
                          ),
                        ),
                        const SizedBox(height: AuroraSpacing.md),

                        // ─── Phone Number CTA (primary) ───
                        _buildPhoneSection(state),

                        const SizedBox(height: AuroraSpacing.lg),

                        // ─── Social Logins ───
                        _buildSocialButtons(),

                        const SizedBox(height: AuroraSpacing.xl),

                        // ─── Existing account link ───
                        TextButton(
                          onPressed: () {},
                          child: Text(
                            'دخول لحساب موجود',
                            style: AuroraText.bodyMedium.copyWith(
                              color: AuroraColors.textPrimary,
                              decoration: TextDecoration.underline,
                              decorationColor: AuroraColors.textHint,
                            ),
                          ),
                        ),
                        const SizedBox(height: AuroraSpacing.md),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  Widget _buildHeader() {
    return Column(
      children: [
        // HANCR لوغو نصي + glow
        ShaderMask(
          shaderCallback: (rect) => AuroraColors.emberRadial.createShader(rect),
          child: Text(
            'HANCR',
            style: AuroraText.displayLarge.copyWith(
              fontSize: 36,
              color: Colors.white,
              fontWeight: FontWeight.w900,
              letterSpacing: 4,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'دخول / تسجيل',
          style: AuroraText.bodyMedium.copyWith(
            color: AuroraColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildHero() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'HANCR — اختيارك المتميِّز',
          style: AuroraText.bodyLarge.copyWith(
            color: AuroraColors.textPrimary,
          ),
        ),
        const SizedBox(height: AuroraSpacing.sm),
        Text(
          'تنقل ذكي،\nأعيد تصميمه.',
          style: AuroraText.displayLarge.copyWith(
            color: AuroraColors.pearl,
            fontSize: 36,
            fontWeight: FontWeight.w800,
            height: 1.1,
          ),
        ),
        const SizedBox(height: AuroraSpacing.md),
        Divider(color: AuroraColors.border, height: 1),
        const SizedBox(height: AuroraSpacing.md),
        Text(
          'احجز رحلات فاخرة في ثوانٍ، تتبَّع السائقين مباشرة، '
          'واستمتع برحلات شخصية في مدينتك.',
          style: AuroraText.bodyMedium.copyWith(
            color: AuroraColors.textSecondary,
            height: 1.6,
          ),
        ),
      ],
    );
  }

  Widget _buildCarIllustration() {
    // Placeholder للـ 3D car. لاحقاً: استبدل بـ Lottie animation أو SVG.
    return Container(
      height: 180,
      decoration: BoxDecoration(
        gradient: RadialGradient(
          colors: [
            AuroraColors.emberMute.withValues(alpha: 0.3),
            Colors.transparent,
          ],
        ),
      ),
      child: const Center(
        child: Icon(
          Icons.directions_car,
          size: 130,
          color: AuroraColors.emberLight,
        ),
      ),
    );
  }

  Widget _buildPhoneSection(AuthState state) {
    if (!_expanded) {
      return AuroraButton.primary(
        label: 'تسجيل برقم الهاتف',
        icon: Icons.phone_iphone,
        loading: state is AuthLoading,
        onPressed: () => setState(() => _expanded = true),
      );
    }
    return Column(
      children: [
        Row(
          children: [
            // Dial code dropdown
            Container(
              decoration: BoxDecoration(
                color: AuroraColors.ash,
                borderRadius: BorderRadius.circular(AuroraRadius.md),
                border: Border.all(color: AuroraColors.border),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _dialCode,
                  dropdownColor: AuroraColors.smoke,
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  style: AuroraText.bodyLarge,
                  items: _countries
                      .map((c) => DropdownMenuItem(
                            value: c.code,
                            child: Text('${c.flag} ${c.code}'),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _dialCode = v ?? '+966'),
                ),
              ),
            ),
            const SizedBox(width: AuroraSpacing.sm),
            Expanded(
              child: TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                onChanged: (_) => setState(() {}),
                style: AuroraText.bodyLarge,
                decoration: const InputDecoration(
                  hintText: '5XXXXXXXX',
                  prefixIcon: Icon(Icons.phone, color: AuroraColors.textHint),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: AuroraSpacing.md),
        AuroraButton.primary(
          label: 'متابعة',
          trailingIcon: Icons.arrow_forward,
          loading: state is AuthLoading,
          onPressed: _canSubmit ? _submit : null,
        ),
      ],
    );
  }

  Widget _buildSocialButtons() {
    return Row(
      children: [
        Expanded(child: _socialButton(Icons.g_mobiledata, 'Google')),
        const SizedBox(width: AuroraSpacing.sm),
        Expanded(child: _socialButton(Icons.apple, 'Apple')),
        const SizedBox(width: AuroraSpacing.sm),
        Expanded(child: _socialButton(Icons.close, 'X')),
      ],
    );
  }

  Widget _socialButton(IconData icon, String label) {
    return Container(
      height: 64,
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('$label قريباً'),
                backgroundColor: AuroraColors.ash,
              ),
            );
          },
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: AuroraColors.ember, size: 26),
              const SizedBox(height: 2),
              Text(
                label,
                style: AuroraText.caption.copyWith(
                  color: AuroraColors.textPrimary,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
