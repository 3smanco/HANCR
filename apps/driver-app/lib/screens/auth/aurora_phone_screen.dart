import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/auth/auth_state.dart';
import '../../core/config/app_config.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/motion/motion.dart';
import '../../core/utils/country_detect.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraPhoneScreen — تسجيل دخول الكابتن بنمط Aurora الفاخر.
/// خلفية سينمائية + هالة ember + هوية HANCR + كشف دولة تلقائي + دخول اجتماعي.
class AuroraPhoneScreen extends StatefulWidget {
  const AuroraPhoneScreen({super.key});

  @override
  State<AuroraPhoneScreen> createState() => _AuroraPhoneScreenState();
}

class _AuroraPhoneScreenState extends State<AuroraPhoneScreen> {
  bool _expanded = false;
  final _phoneCtrl = TextEditingController();
  String _dialCode = '+966';

  static const _countries = [
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

  Future<void> _detectCountry() async {
    final localeDial = dialCodeFromLocale();
    if (localeDial != null && mounted) setState(() => _dialCode = localeDial);
    try {
      final perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        await Geolocator.requestPermission();
      }
      final p = await Geolocator.getLastKnownPosition() ??
          await Geolocator.getCurrentPosition(
            locationSettings:
                const LocationSettings(timeLimit: Duration(seconds: 5)),
          );
      final dial = dialCodeFromCoords(p.latitude, p.longitude);
      if (dial != null && mounted) setState(() => _dialCode = dial);
    } catch (_) {/* يبقى احتياط الـ locale */}
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    super.dispose();
  }

  bool get _canSubmit => _phoneCtrl.text.trim().length >= 6;

  void _submit() {
    if (!_canSubmit) return;
    Haptics.selection();
    final phone = '$_dialCode${_phoneCtrl.text.trim()}';
    context.read<AuthBloc>().add(AuthSendOtpRequested(phone));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        showBottomHalo: true,
        showTopHalo: true,
        child: BlocConsumer<AuthBloc, AuthState>(
          listener: (ctx, state) {
            if (state is AuthOtpSent) {
              ctx.push('/auth/otp',
                  extra: {'phone': state.phone, 'devOtp': state.devOtp});
            }
            if (state is AuthNeedsPhone) {
              ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
                content: Text(tr('addPhoneToComplete')),
                backgroundColor: AuroraColors.smoke,
              ));
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
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: MediaQuery.of(context).size.height -
                        MediaQuery.of(context).padding.vertical,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AuroraSpacing.xxl),
                    child: Column(
                      children: [
                        const SizedBox(height: AuroraSpacing.xl),
                        _buildHeader(),
                        const SizedBox(height: AuroraSpacing.huge),
                        _buildHero(),
                        const SizedBox(height: AuroraSpacing.xxl),
                        _buildCarIllustration(),
                        const Spacer(),
                        _buildPhoneSection(state),
                        const SizedBox(height: AuroraSpacing.lg),
                        _buildSocialButtons(),
                        const SizedBox(height: AuroraSpacing.lg),
                      ],
                    ).animate().fadeIn(duration: Motion.base),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
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
          tr('captainTagline'),
          style: AuroraText.bodyMedium
              .copyWith(color: AuroraColors.ember, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }

  Widget _buildHero() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          tr('loginSignup'),
          style: AuroraText.bodyLarge.copyWith(color: AuroraColors.textPrimary),
        ),
        const SizedBox(height: AuroraSpacing.sm),
        Text(
          tr('captainHeroTitle'),
          style: AuroraText.displayLarge.copyWith(
            color: AuroraColors.pearl,
            fontSize: 38,
            fontWeight: FontWeight.w800,
            height: 1.05,
          ),
        ),
        const SizedBox(height: AuroraSpacing.md),
        Divider(color: AuroraColors.border, height: 1),
        const SizedBox(height: AuroraSpacing.md),
        Text(
          tr('captainHeroSub'),
          style: AuroraText.bodyMedium
              .copyWith(color: AuroraColors.textSecondary, height: 1.6),
        ),
      ],
    );
  }

  Widget _buildCarIllustration() {
    return Container(
      height: 150,
      decoration: BoxDecoration(
        gradient: RadialGradient(
          colors: [
            AuroraColors.emberMute.withValues(alpha: 0.30),
            Colors.transparent,
          ],
        ),
      ),
      child: Center(
        child: Icon(Icons.local_taxi_rounded,
            size: 120, color: AuroraColors.emberLight),
      ),
    ).animate().fadeIn(duration: Motion.slow).scale(
          begin: const Offset(0.9, 0.9),
          end: const Offset(1, 1),
          curve: Motion.decelerate,
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
                autofocus: true,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                onChanged: (_) => setState(() {}),
                onSubmitted: (_) => _submit(),
                style: AuroraText.bodyLarge,
                decoration: InputDecoration(
                  hintText: tr('phoneHint'),
                  prefixIcon:
                      const Icon(Icons.phone, color: AuroraColors.textHint),
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

  Widget _buildSocialButtons() {
    final googleReady = AppConfig.googleServerClientId.isNotEmpty;
    return Column(
      children: [
        Row(
          children: [
            const Expanded(child: Divider(color: AuroraColors.border, height: 1)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.md),
              child: Text(
                tr('orContinueWith'),
                style: AuroraText.bodySmall
                    .copyWith(color: AuroraColors.textSecondary),
              ),
            ),
            const Expanded(child: Divider(color: AuroraColors.border, height: 1)),
          ],
        ),
        const SizedBox(height: AuroraSpacing.md),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // البريد — دخول حقيقي (OTP)
            _socialButton(Icons.alternate_email,
                onTap: () => context.push('/auth/email')),
            // Google — يظهر فقط حين تجهيزه (GOOGLE_SERVER_CLIENT_ID)
            if (googleReady) ...[
              const SizedBox(width: AuroraSpacing.md),
              _socialButton(
                Icons.g_mobiledata_rounded,
                onTap: () => context
                    .read<AuthBloc>()
                    .add(const AuthGoogleSignInRequested()),
              ),
            ],
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
          width: 72,
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
