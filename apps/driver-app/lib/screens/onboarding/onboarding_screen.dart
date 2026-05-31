import '../../core/i18n/app_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../blocs/driver/driver_bloc.dart';
import '../../blocs/driver/driver_event.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';

/// OnboardingScreen — متعدّد الخطوات للسائق الجديد
///
/// 4 خطوات:
///   1. Personal info (firstName + lastName)
///   2. Car details (brand + model + year + color)
///   3. Plate number + license number
///   4. Document uploads (placeholder UI — uploads إلى S3 لاحقاً)
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  static const _totalSteps = 4;
  int _currentStep = 0;

  // ── Step 1: Personal ──
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();

  // ── Step 2: Vehicle ──
  final _brandCtrl = TextEditingController();
  final _modelCtrl = TextEditingController();
  final _yearCtrl = TextEditingController();
  final _colorCtrl = TextEditingController();
  String? _selectedColor;

  // ── Step 3: License ──
  final _plateCtrl = TextEditingController();
  final _licenseCtrl = TextEditingController();

  // ── Step 4: Uploads (placeholders) ──
  bool _licensePhotoUploaded = false;
  bool _carPhotoUploaded = false;
  bool _nationalIdUploaded = false;

  bool _saving = false;

  @override
  void dispose() {
    _firstCtrl.dispose();
    _lastCtrl.dispose();
    _brandCtrl.dispose();
    _modelCtrl.dispose();
    _yearCtrl.dispose();
    _colorCtrl.dispose();
    _plateCtrl.dispose();
    _licenseCtrl.dispose();
    super.dispose();
  }

  // ─── Per-step validation ───────────────────────────────────────────────
  bool _validateStep(int step) {
    switch (step) {
      case 0:
        return _firstCtrl.text.trim().isNotEmpty &&
            _lastCtrl.text.trim().isNotEmpty;
      case 1:
        return _brandCtrl.text.trim().isNotEmpty &&
            _modelCtrl.text.trim().isNotEmpty &&
            _yearCtrl.text.trim().isNotEmpty &&
            (_selectedColor != null && _selectedColor!.isNotEmpty);
      case 2:
        return _plateCtrl.text.trim().isNotEmpty;
      case 3:
        return _licensePhotoUploaded && _nationalIdUploaded;
    }
    return true;
  }

  void _next() {
    if (!_validateStep(_currentStep)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(tr('completeAllFields'))),
      );
      return;
    }
    if (_currentStep < _totalSteps - 1) {
      setState(() => _currentStep++);
    } else {
      _submit();
    }
  }

  void _back() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  Future<void> _submit() async {
    setState(() => _saving = true);
    final year = int.tryParse(_yearCtrl.text.trim());
    context.read<DriverBloc>().add(
          DriverUpdateRequested(
            firstName: _firstCtrl.text.trim(),
            lastName: _lastCtrl.text.trim(),
            carBrand: _brandCtrl.text.trim(),
            carModel: _modelCtrl.text.trim(),
            carColor: _selectedColor ?? _colorCtrl.text.trim(),
            plateNumber: _plateCtrl.text.trim(),
            carYear: year,
          ),
        );
    // Allow Bloc time to process
    await Future<void>.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;
    setState(() => _saving = false);
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HancrColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // ─── Header with progress ───
            _Header(
              currentStep: _currentStep,
              totalSteps: _totalSteps,
              onBack: _currentStep > 0 ? _back : null,
            ),

            // ─── Step content ───
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: HancrSpacing.lg,
                ),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  transitionBuilder: (child, anim) => FadeTransition(
                    opacity: anim,
                    child: child,
                  ),
                  child: _buildStep(_currentStep),
                ),
              ),
            ),

            // ─── Bottom CTA ───
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.all(HancrSpacing.lg),
                child: HancrButton.primary(
                  label: _currentStep == _totalSteps - 1
                      ? tr('finishRegistration')
                      : tr('continueBtn'),
                  icon: _currentStep == _totalSteps - 1
                      ? Icons.check_rounded
                      : Icons.arrow_forward_rounded,
                  loading: _saving,
                  onPressed: _next,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep(int step) {
    switch (step) {
      case 0:
        return _Step1Personal(
          key: const ValueKey('step0'),
          firstCtrl: _firstCtrl,
          lastCtrl: _lastCtrl,
        );
      case 1:
        return _Step2Vehicle(
          key: const ValueKey('step1'),
          brandCtrl: _brandCtrl,
          modelCtrl: _modelCtrl,
          yearCtrl: _yearCtrl,
          selectedColor: _selectedColor,
          onColorSelect: (c) => setState(() => _selectedColor = c),
        );
      case 2:
        return _Step3License(
          key: const ValueKey('step2'),
          plateCtrl: _plateCtrl,
          licenseCtrl: _licenseCtrl,
        );
      case 3:
        return _Step4Documents(
          key: const ValueKey('step3'),
          licensePhotoUploaded: _licensePhotoUploaded,
          carPhotoUploaded: _carPhotoUploaded,
          nationalIdUploaded: _nationalIdUploaded,
          onLicensePhoto: () =>
              setState(() => _licensePhotoUploaded = !_licensePhotoUploaded),
          onCarPhoto: () =>
              setState(() => _carPhotoUploaded = !_carPhotoUploaded),
          onNationalId: () =>
              setState(() => _nationalIdUploaded = !_nationalIdUploaded),
        );
    }
    return const SizedBox.shrink();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Header with stepped progress
// ─────────────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({
    required this.currentStep,
    required this.totalSteps,
    this.onBack,
  });

  final int currentStep;
  final int totalSteps;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(
        HancrSpacing.lg,
        HancrSpacing.md,
        HancrSpacing.lg,
        HancrSpacing.xl,
      ),
      decoration: BoxDecoration(
        gradient: HancrColors.brandGradient,
        borderRadius: const BorderRadius.vertical(
          bottom: Radius.circular(HancrRadius.xxl),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Back + step counter
          Row(
            children: [
              if (onBack != null)
                HancrIconButton(
                  icon: Icons.arrow_back_rounded,
                  onPressed: onBack,
                  backgroundColor: Colors.white.withValues(alpha: 0.18),
                  foregroundColor: Colors.white,
                )
              else
                const SizedBox(width: 44),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: HancrSpacing.md,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(HancrRadius.pill),
                ),
                child: Text(
                  'خطوة ${currentStep + 1} من $totalSteps',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: HancrSpacing.lg),
          Text(
            tr('joinAsCaptain'),
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            _stepHint(currentStep),
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: HancrSpacing.lg),
          // Progress steps row
          Row(
            children: List.generate(totalSteps, (i) {
              final reached = i <= currentStep;
              final current = i == currentStep;
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                    right: i < totalSteps - 1 ? 6 : 0,
                  ),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    height: 4,
                    decoration: BoxDecoration(
                      color: reached
                          ? Colors.white
                          : Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(2),
                      boxShadow: current
                          ? [
                              BoxShadow(
                                color: Colors.white.withValues(alpha: 0.5),
                                blurRadius: 6,
                              ),
                            ]
                          : null,
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  static String _stepHint(int step) {
    switch (step) {
      case 0:
        return tr('aboutYou');
      case 1:
        return tr('carDetailsStep');
      case 2:
        return tr('licensePlateStep');
      case 3:
        return tr('requiredDocs');
    }
    return '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Personal Info
// ─────────────────────────────────────────────────────────────────────────────

class _Step1Personal extends StatelessWidget {
  const _Step1Personal({
    super.key,
    required this.firstCtrl,
    required this.lastCtrl,
  });

  final TextEditingController firstCtrl;
  final TextEditingController lastCtrl;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: HancrSpacing.xl),
        _SectionTitle(
          icon: Icons.person_rounded,
          title: tr('personalInfo'),
        ),
        const SizedBox(height: HancrSpacing.lg),
        TextField(
          controller: firstCtrl,
          textCapitalization: TextCapitalization.words,
          decoration: InputDecoration(
            labelText: tr('firstName'),
            prefixIcon: Icon(Icons.person_outline_rounded),
          ),
        ),
        const SizedBox(height: HancrSpacing.md),
        TextField(
          controller: lastCtrl,
          textCapitalization: TextCapitalization.words,
          decoration: InputDecoration(
            labelText: tr('lastName'),
            prefixIcon: Icon(Icons.person_outline_rounded),
          ),
        ),
        const SizedBox(height: HancrSpacing.lg),
        HancrCard(
          backgroundColor: HancrColors.violetLight.withValues(alpha: 0.4),
          child: Row(
            children: [
              Icon(
                Icons.shield_rounded,
                color: HancrColors.violetDeep,
                size: 20,
              ),
              SizedBox(width: HancrSpacing.sm),
              Expanded(
                child: Text(
                  tr('dataProtected'),
                  style: TextStyle(
                    fontSize: 12,
                    color: HancrColors.violetDeep,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Vehicle Details
// ─────────────────────────────────────────────────────────────────────────────

class _Step2Vehicle extends StatelessWidget {
  const _Step2Vehicle({
    super.key,
    required this.brandCtrl,
    required this.modelCtrl,
    required this.yearCtrl,
    required this.selectedColor,
    required this.onColorSelect,
  });

  final TextEditingController brandCtrl;
  final TextEditingController modelCtrl;
  final TextEditingController yearCtrl;
  final String? selectedColor;
  final void Function(String) onColorSelect;

  List<(String, Color)> get _colors => [
    (tr('colWhite'), Color(0xFFFFFFFF)),
    (tr('colBlack'), Color(0xFF1F2937)),
    (tr('colSilver'), Color(0xFFC0C0C0)),
    (tr('colGray'), Color(0xFF6B7280)),
    (tr('colRed'), Color(0xFFDC2626)),
    (tr('colBlue'), Color(0xFF2563EB)),
    (tr('colBrown'), Color(0xFF92400E)),
    (tr('colGold'), Color(0xFFD4AF37)),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: HancrSpacing.xl),
        _SectionTitle(
          icon: Icons.directions_car_rounded,
          title: tr('carDataSection'),
        ),
        const SizedBox(height: HancrSpacing.lg),
        TextField(
          controller: brandCtrl,
          textCapitalization: TextCapitalization.words,
          decoration: InputDecoration(
            labelText: tr('brandHint'),
            prefixIcon: Icon(Icons.directions_car_outlined),
          ),
        ),
        const SizedBox(height: HancrSpacing.md),
        TextField(
          controller: modelCtrl,
          textCapitalization: TextCapitalization.words,
          decoration: InputDecoration(
            labelText: tr('modelHint'),
            prefixIcon: Icon(Icons.car_repair_rounded),
          ),
        ),
        const SizedBox(height: HancrSpacing.md),
        TextField(
          controller: yearCtrl,
          keyboardType: TextInputType.number,
          maxLength: 4,
          decoration: InputDecoration(
            labelText: tr('manufactureYear'),
            prefixIcon: Icon(Icons.calendar_today_rounded),
            counterText: '',
          ),
        ),
        const SizedBox(height: HancrSpacing.lg),
        // Color picker
        Text(
          tr('carColor'),
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: HancrColors.textPrimary,
          ),
        ),
        const SizedBox(height: HancrSpacing.sm),
        Wrap(
          spacing: HancrSpacing.sm,
          runSpacing: HancrSpacing.sm,
          children: _colors.map((c) {
            final selected = c.$1 == selectedColor;
            return GestureDetector(
              onTap: () => onColorSelect(c.$1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                  horizontal: HancrSpacing.md,
                  vertical: HancrSpacing.sm,
                ),
                decoration: BoxDecoration(
                  color: selected ? HancrColors.violetLight : Colors.white,
                  border: Border.all(
                    color: selected
                        ? HancrColors.violet
                        : HancrColors.divider,
                    width: selected ? 2 : 1,
                  ),
                  borderRadius: BorderRadius.circular(HancrRadius.pill),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: c.$2,
                        shape: BoxShape.circle,
                        border: Border.all(color: HancrColors.borderStrong),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      c.$1,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: selected
                            ? HancrColors.violetDeep
                            : HancrColors.textPrimary,
                      ),
                    ),
                    if (selected) ...[
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.check_rounded,
                        size: 14,
                        color: HancrColors.violetDeep,
                      ),
                    ],
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — License + Plate
// ─────────────────────────────────────────────────────────────────────────────

class _Step3License extends StatelessWidget {
  const _Step3License({
    super.key,
    required this.plateCtrl,
    required this.licenseCtrl,
  });

  final TextEditingController plateCtrl;
  final TextEditingController licenseCtrl;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: HancrSpacing.xl),
        _SectionTitle(
          icon: Icons.confirmation_number_rounded,
          title: tr('plateLicenseSection'),
        ),
        const SizedBox(height: HancrSpacing.lg),
        TextField(
          controller: plateCtrl,
          textCapitalization: TextCapitalization.characters,
          decoration: InputDecoration(
            labelText: tr('plateHint'),
            prefixIcon: Icon(Icons.pin_rounded),
          ),
        ),
        const SizedBox(height: HancrSpacing.md),
        TextField(
          controller: licenseCtrl,
          decoration: InputDecoration(
            labelText: tr('licenseNumber'),
            prefixIcon: Icon(Icons.badge_outlined),
          ),
        ),
        const SizedBox(height: HancrSpacing.lg),
        HancrCard(
          backgroundColor: HancrColors.warningBg,
          child: Row(
            children: [
              Icon(
                Icons.info_outline_rounded,
                color: Color(0xFF92400E),
                size: 20,
              ),
              SizedBox(width: HancrSpacing.sm),
              Expanded(
                child: Text(
                  tr('verifyAccuracy'),
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF92400E),
                    fontWeight: FontWeight.w600,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Document Uploads
// ─────────────────────────────────────────────────────────────────────────────

class _Step4Documents extends StatelessWidget {
  const _Step4Documents({
    super.key,
    required this.licensePhotoUploaded,
    required this.carPhotoUploaded,
    required this.nationalIdUploaded,
    required this.onLicensePhoto,
    required this.onCarPhoto,
    required this.onNationalId,
  });

  final bool licensePhotoUploaded;
  final bool carPhotoUploaded;
  final bool nationalIdUploaded;
  final VoidCallback onLicensePhoto;
  final VoidCallback onCarPhoto;
  final VoidCallback onNationalId;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: HancrSpacing.xl),
        _SectionTitle(
          icon: Icons.upload_file_rounded,
          title: tr('requiredDocs'),
        ),
        const SizedBox(height: HancrSpacing.lg),
        _UploadCard(
          title: 'صورة رخصة القيادة',
          subtitle: 'صورة واضحة لرخصتك سارية المفعول',
          icon: Icons.badge_rounded,
          uploaded: licensePhotoUploaded,
          required: true,
          onTap: onLicensePhoto,
        ),
        const SizedBox(height: HancrSpacing.md),
        _UploadCard(
          title: 'صورة الهوية الوطنية',
          subtitle: 'الوجهين الأمامي والخلفي',
          icon: Icons.credit_card_rounded,
          uploaded: nationalIdUploaded,
          required: true,
          onTap: onNationalId,
        ),
        const SizedBox(height: HancrSpacing.md),
        _UploadCard(
          title: 'صورة السيارة',
          subtitle: 'صورة من الأمام تُظهر اللوحة',
          icon: Icons.directions_car_rounded,
          uploaded: carPhotoUploaded,
          required: false,
          onTap: onCarPhoto,
        ),
        const SizedBox(height: HancrSpacing.lg),
        HancrCard(
          backgroundColor: HancrColors.successBg,
          child: Row(
            children: [
              Icon(
                Icons.verified_user_rounded,
                color: HancrColors.success,
                size: 20,
              ),
              SizedBox(width: HancrSpacing.sm),
              Expanded(
                child: Text(
                  'بعد إرسال الوثائق، سيُراجع فريقنا طلبك خلال 24 ساعة',
                  style: TextStyle(
                    fontSize: 12,
                    color: HancrColors.success,
                    fontWeight: FontWeight.w600,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _UploadCard extends StatelessWidget {
  const _UploadCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.uploaded,
    required this.required,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final bool uploaded;
  final bool required;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(HancrRadius.lg),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(HancrSpacing.lg),
          decoration: BoxDecoration(
            color: HancrColors.surface,
            border: Border.all(
              color: uploaded ? HancrColors.success : HancrColors.divider,
              width: uploaded ? 2 : 1,
              style: uploaded ? BorderStyle.solid : BorderStyle.solid,
            ),
            borderRadius: BorderRadius.circular(HancrRadius.lg),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: uploaded
                      ? HancrColors.successBg
                      : HancrColors.violetLight,
                  borderRadius: BorderRadius.circular(HancrRadius.md),
                ),
                child: Icon(
                  uploaded ? Icons.check_circle_rounded : icon,
                  color: uploaded ? HancrColors.success : HancrColors.violet,
                  size: 24,
                ),
              ),
              const SizedBox(width: HancrSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: HancrColors.textPrimary,
                          ),
                        ),
                        const SizedBox(width: 4),
                        if (required)
                          const Text(
                            '*',
                            style: TextStyle(
                              color: HancrColors.error,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: HancrColors.textSecondary,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                uploaded
                    ? Icons.replay_rounded
                    : Icons.cloud_upload_rounded,
                color: uploaded
                    ? HancrColors.textSecondary
                    : HancrColors.violet,
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Common section title
// ─────────────────────────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.icon, required this.title});
  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: HancrColors.violetLight,
            borderRadius: BorderRadius.circular(HancrRadius.sm),
          ),
          child: Icon(icon, color: HancrColors.violetDeep, size: 18),
        ),
        const SizedBox(width: HancrSpacing.sm),
        Text(
          title,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: HancrColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
