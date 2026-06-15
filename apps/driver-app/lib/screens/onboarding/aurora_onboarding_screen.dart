import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../blocs/driver/driver_bloc.dart';
import '../../blocs/driver/driver_event.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/motion/motion.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/widgets/document_capture_card.dart';

/// AuroraOnboardingScreen — تسجيل السائق الكامل بنمط Uber:
/// بيانات شخصية → المركبة → المستندات (التقاط بالكاميرا) → التحقّق بالسيلفي →
/// مراجعة وإرسال. المستندات تُرفع فوراً (presigned PUT) ويُراجعها الأدمن.
class AuroraOnboardingScreen extends StatefulWidget {
  const AuroraOnboardingScreen({super.key});

  @override
  State<AuroraOnboardingScreen> createState() => _AuroraOnboardingScreenState();
}

class _AuroraOnboardingScreenState extends State<AuroraOnboardingScreen> {
  static const _steps = 5;
  int _step = 0;
  bool _saving = false;

  final _first = TextEditingController();
  final _last = TextEditingController();
  final _brand = TextEditingController();
  final _model = TextEditingController();
  final _year = TextEditingController();
  final _plate = TextEditingController();
  String? _color;

  final Set<String> _uploaded = {};

  static const _colors = [
    ('أبيض', Color(0xFFFFFFFF)),
    ('أسود', Color(0xFF1A1A1A)),
    ('فضّي', Color(0xFFC0C0C0)),
    ('رمادي', Color(0xFF808080)),
    ('أزرق', Color(0xFF2563EB)),
    ('أحمر', Color(0xFFDC2626)),
  ];

  @override
  void dispose() {
    for (final c in [_first, _last, _brand, _model, _year, _plate]) {
      c.dispose();
    }
    super.dispose();
  }

  bool _valid(int s) {
    switch (s) {
      case 0:
        return _first.text.trim().isNotEmpty && _last.text.trim().isNotEmpty;
      case 1:
        return _brand.text.trim().isNotEmpty &&
            _model.text.trim().isNotEmpty &&
            _year.text.trim().isNotEmpty &&
            _color != null;
      case 2:
        return _uploaded.contains('national_id') &&
            _uploaded.contains('license') &&
            _plate.text.trim().isNotEmpty;
      case 3:
        return _uploaded.contains('selfie');
      default:
        return true;
    }
  }

  void _next() {
    if (!_valid(_step)) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(tr('completeAllFields')),
        backgroundColor: AuroraColors.smoke,
      ));
      return;
    }
    if (_step < _steps - 1) {
      Haptics.selection();
      setState(() => _step++);
    } else {
      _submit();
    }
  }

  Future<void> _submit() async {
    setState(() => _saving = true);
    context.read<DriverBloc>().add(DriverUpdateRequested(
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          carBrand: _brand.text.trim(),
          carModel: _model.text.trim(),
          carColor: _color ?? '',
          plateNumber: _plate.text.trim(),
          carYear: int.tryParse(_year.text.trim()),
        ));
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    Haptics.success();
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        child: SafeArea(
          child: Column(
            children: [
              _header(),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AuroraSpacing.xxl),
                  child: AnimatedSwitcher(
                    duration: Motion.base,
                    transitionBuilder: (c, a) =>
                        FadeTransition(opacity: a, child: c),
                    child: KeyedSubtree(
                      key: ValueKey(_step),
                      child: _body(_step),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AuroraSpacing.xxl),
                child: AuroraButton.primary(
                  label: _step == _steps - 1
                      ? tr('finishRegistration')
                      : tr('continueBtn'),
                  trailingIcon: _step == _steps - 1
                      ? Icons.check_rounded
                      : Icons.arrow_forward,
                  loading: _saving,
                  onPressed: _next,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _header() {
    const titles = [
      'البيانات الشخصية',
      'بيانات المركبة',
      'المستندات',
      'التحقّق من الهوية',
      'مراجعة وإرسال',
    ];
    return Padding(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (_step > 0)
                GestureDetector(
                  onTap: () => setState(() => _step--),
                  child: Icon(Icons.arrow_forward,
                      color: AuroraColors.pearl, size: 22),
                ),
              const Spacer(),
              Text('${_step + 1} / $_steps', style: AuroraText.caption),
            ],
          ),
          const SizedBox(height: AuroraSpacing.sm),
          Row(
            children: List.generate(_steps, (i) {
              final done = i <= _step;
              return Expanded(
                child: Container(
                  height: 4,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    color: done ? AuroraColors.ember : AuroraColors.ash,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: AuroraSpacing.md),
          Text(titles[_step], style: AuroraText.displayMedium),
        ],
      ),
    );
  }

  Widget _body(int s) {
    switch (s) {
      case 0:
        return Column(
          children: [
            _field(_first, tr('firstName'), Icons.person),
            const SizedBox(height: AuroraSpacing.md),
            _field(_last, tr('lastName'), Icons.person_outline),
          ],
        );
      case 1:
        return Column(
          children: [
            _field(_brand, tr('carBrand'), Icons.directions_car),
            const SizedBox(height: AuroraSpacing.md),
            _field(_model, tr('carModel'), Icons.car_repair),
            const SizedBox(height: AuroraSpacing.md),
            _field(_year, tr('carYear'), Icons.calendar_today,
                number: true),
            const SizedBox(height: AuroraSpacing.lg),
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: Text(tr('carColor'), style: AuroraText.titleSmall),
            ),
            const SizedBox(height: AuroraSpacing.sm),
            Wrap(
              spacing: AuroraSpacing.sm,
              runSpacing: AuroraSpacing.sm,
              children: _colors.map((c) {
                final sel = _color == c.$1;
                return GestureDetector(
                  onTap: () => setState(() => _color = c.$1),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AuroraSpacing.md,
                        vertical: AuroraSpacing.sm),
                    decoration: BoxDecoration(
                      color: sel ? AuroraColors.emberMute : AuroraColors.ash,
                      borderRadius: BorderRadius.circular(AuroraRadius.pill),
                      border: Border.all(
                          color: sel
                              ? AuroraColors.ember
                              : AuroraColors.border),
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
                            border:
                                Border.all(color: AuroraColors.border),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(c.$1, style: AuroraText.bodySmall),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        );
      case 2:
        return Column(
          children: [
            _field(_plate, tr('plateNumber'), Icons.pin),
            const SizedBox(height: AuroraSpacing.md),
            DocumentCaptureCard(
              type: 'national_id',
              title: tr('doc_national_id'),
              icon: Icons.badge,
              onUploaded: (_) => setState(() => _uploaded.add('national_id')),
            ),
            const SizedBox(height: AuroraSpacing.sm),
            DocumentCaptureCard(
              type: 'license',
              title: tr('doc_license'),
              icon: Icons.directions_car,
              onUploaded: (_) => setState(() => _uploaded.add('license')),
            ),
            const SizedBox(height: AuroraSpacing.sm),
            DocumentCaptureCard(
              type: 'vehicle_registration',
              title: '${tr('doc_vehicle_registration')} (${tr('optional')})',
              icon: Icons.assignment,
              onUploaded: (_) =>
                  setState(() => _uploaded.add('vehicle_registration')),
            ),
          ],
        );
      case 3:
        return Column(
          children: [
            const SizedBox(height: AuroraSpacing.md),
            Icon(Icons.face_retouching_natural,
                size: 64, color: AuroraColors.ember),
            const SizedBox(height: AuroraSpacing.md),
            Text(tr('selfieHint'),
                textAlign: TextAlign.center,
                style: AuroraText.bodyMedium
                    .copyWith(color: AuroraColors.textSecondary)),
            const SizedBox(height: AuroraSpacing.xl),
            DocumentCaptureCard(
              type: 'selfie',
              title: tr('identitySelfie'),
              icon: Icons.camera_front,
              selfie: true,
              hint: tr('selfieTapHint'),
              onUploaded: (_) => setState(() => _uploaded.add('selfie')),
            ),
          ],
        );
      default:
        return _review();
    }
  }

  Widget _review() {
    Widget row(String k, String v) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(
            children: [
              Text(k, style: AuroraText.bodyMedium
                  .copyWith(color: AuroraColors.textSecondary)),
              const Spacer(),
              Text(v, style: AuroraText.bodyMedium),
            ],
          ),
        );
    return AuroraCard(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      child: Column(
        children: [
          row(tr('firstName'), '${_first.text} ${_last.text}'),
          const Divider(color: AuroraColors.divider),
          row(tr('carBrand'),
              '${_brand.text} ${_model.text} • ${_year.text}'),
          row(tr('carColor'), _color ?? '—'),
          row(tr('plateNumber'), _plate.text),
          const Divider(color: AuroraColors.divider),
          row(tr('myDocuments'),
              '${_uploaded.where((t) => t != 'selfie').length} ✓'),
          row(tr('identitySelfie'),
              _uploaded.contains('selfie') ? '✓' : '—'),
          const SizedBox(height: AuroraSpacing.md),
          Text(tr('reviewNote'),
              textAlign: TextAlign.center,
              style: AuroraText.caption
                  .copyWith(color: AuroraColors.textHint)),
        ],
      ),
    );
  }

  Widget _field(TextEditingController c, String label, IconData icon,
      {bool number = false}) {
    return TextField(
      controller: c,
      keyboardType: number ? TextInputType.number : TextInputType.text,
      inputFormatters:
          number ? [FilteringTextInputFormatter.digitsOnly] : null,
      onChanged: (_) => setState(() {}),
      style: AuroraText.bodyLarge,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AuroraColors.textHint),
      ),
    );
  }
}
