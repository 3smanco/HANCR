import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/utils/country_detect.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/widgets/car_art.dart';
import '../../core/motion/motion.dart';

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
  void initState() {
    super.initState();
    _detectCountry();
  }

  /// كشف رمز الدولة من موقع الجهاز (GPS) مع احتياط إعداد المنطقة.
  Future<void> _detectCountry() async {
    // احتياط فوري من إعداد منطقة الجهاز قبل انتظار الـ GPS
    final localeDial = dialCodeFromLocale();
    if (localeDial != null && mounted) {
      setState(() => _dialCode = localeDial);
    }
    try {
      final perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        await Geolocator.requestPermission();
      }
      final p = await Geolocator.getLastKnownPosition() ??
          await Geolocator.getCurrentPosition(
            timeLimit: const Duration(seconds: 5),
          );
      final dial = dialCodeFromCoords(p.latitude, p.longitude);
      if (dial != null && mounted) {
        setState(() => _dialCode = dial);
      }
    } catch (_) {
      // يبقى احتياط الـ locale أو القيمة الافتراضية
    }
  }

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
    // push (لا go) كي يعمل زر الرجوع من شاشة الـ OTP للرجوع لشاشة الهاتف.
    context.push('/auth/otp', extra: phone);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        showBottomHalo: true,
        child: BlocConsumer<AuthBloc, AuthState>(
          listener: (ctx, state) {
            if (state is AuthNeedsPhone) {
              ScaffoldMessenger.of(ctx).showSnackBar(
                SnackBar(
                  content: Text(tr('addPhoneToComplete')),
                  backgroundColor: AuroraColors.smoke,
                ),
              );
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
                            tr('continueWith'),
                            style: AuroraText.bodyMedium.copyWith(
                              color: AuroraColors.textPrimary,
                            ),
                          ),
                        ),
                        const SizedBox(height: AuroraSpacing.md),

                        // ─── Phone Number CTA (primary) ───
                        _buildPhoneSection(state),

                        const SizedBox(height: AuroraSpacing.lg),

                        // ─── Social login (Google · Apple · X) ───
                        _buildSocialButtons(),

                        const SizedBox(height: AuroraSpacing.lg),

                        // ─── Existing account link (نفس تدفق OTP) ───
                        TextButton(
                          onPressed: () {
                            if (_canSubmit) {
                              _submit();
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(tr('enterPhoneFirst')),
                                  backgroundColor: AuroraColors.smoke,
                                ),
                              );
                            }
                          },
                          child: Text(
                            tr('existingAccount'),
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
          tr('loginSignup'),
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
          tr('tagline'),
          style: AuroraText.bodyLarge.copyWith(
            color: AuroraColors.textPrimary,
          ),
        ),
        const SizedBox(height: AuroraSpacing.sm),
        Text(
          tr('heroTitle'),
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
          tr('heroSub'),
          style: AuroraText.bodyMedium.copyWith(
            color: AuroraColors.textSecondary,
            height: 1.6,
          ),
        ),
      ],
    );
  }

  Widget _buildCarIllustration() {
    // سيارة فاخرة مرسومة بالكود (CarArt) فوق هالة ember، تنساب للداخل.
    return SizedBox(
      height: 180,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // هالة توهّج خلف السيارة
          Container(
            height: 180,
            decoration: BoxDecoration(
              gradient: RadialGradient(
                colors: [
                  AuroraColors.emberMute.withValues(alpha: 0.30),
                  Colors.transparent,
                ],
              ),
            ),
          ),
          GlowPulse(
            color: AuroraColors.ember,
            minBlur: 10,
            maxBlur: 34,
            child: const CarArt(type: CarType.luxury, size: Size(230, 110)),
          )
              .animate()
              .fadeIn(duration: Motion.slow)
              .slideX(begin: -0.4, end: 0, curve: Motion.decelerate),
          // خط أرضية تحت السيارة
          Positioned(
            bottom: 26,
            child: Container(
              width: 200,
              height: 3,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [
                  Colors.transparent,
                  AuroraColors.ember.withValues(alpha: 0.5),
                  Colors.transparent,
                ]),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhoneSection(AuthState state) {
    if (!_expanded) {
      return AuroraButton.primary(
        label: tr('signupPhone'),
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
                decoration: InputDecoration(
                  hintText: '5XXXXXXXX',
                  prefixIcon: Icon(Icons.phone, color: AuroraColors.textHint),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: AuroraSpacing.md),
        AuroraButton.primary(
          label: tr('continueBtn'),
          trailingIcon: Icons.arrow_forward,
          loading: state is AuthLoading,
          onPressed: _canSubmit ? _submit : null,
        ),
      ],
    );
  }

  /// أزرار الدخول الاجتماعي (Google · Apple · X).
  /// مفعّلة بصرياً؛ التكامل مع OAuth قيد الإعداد — تُظهر إشعاراً صادقاً عند الضغط.
  Widget _buildSocialButtons() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: Divider(color: AuroraColors.border, height: 1)),
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: AuroraSpacing.md),
              child: Text(
                tr('orContinueWith'),
                style: AuroraText.bodySmall
                    .copyWith(color: AuroraColors.textSecondary),
              ),
            ),
            Expanded(child: Divider(color: AuroraColors.border, height: 1)),
          ],
        ),
        const SizedBox(height: AuroraSpacing.md),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Google — دخول حقيقي
            _socialButton(
              Icons.g_mobiledata_rounded,
              onTap: () => context
                  .read<AuthBloc>()
                  .add(const AuthGoogleSignInRequested()),
            ),
            const SizedBox(width: AuroraSpacing.md),
            // الإيميل — دخول حقيقي (OTP)
            _socialButton(
              Icons.alternate_email,
              onTap: () => context.push('/auth/email'),
            ),
            const SizedBox(width: AuroraSpacing.md),
            // Apple — قريباً
            _socialButton(
              Icons.apple,
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                content: Text('Apple — ${tr('comingSoonSocial')}'),
                backgroundColor: AuroraColors.smoke,
              )),
            ),
          ],
        ),
      ],
    );
  }

  Widget _socialButton(IconData icon, {required VoidCallback onTap}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        child: Container(
          width: 64,
          height: 56,
          decoration: BoxDecoration(
            color: AuroraColors.ash,
            borderRadius: BorderRadius.circular(AuroraRadius.md),
            border: Border.all(color: AuroraColors.border),
          ),
          child: Icon(icon, color: AuroraColors.pearl, size: 30),
        ),
      ),
    );
  }
}
