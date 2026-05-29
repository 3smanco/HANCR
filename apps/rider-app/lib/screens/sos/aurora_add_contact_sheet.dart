import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/sos/sos_bloc.dart';
import '../../blocs/sos/sos_event.dart';
import '../../core/models/sos_model.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraAddContactSheet — bottom sheet لإضافة جهة طوارئ بنمط Aurora.
class AuroraAddContactSheet extends StatefulWidget {
  const AuroraAddContactSheet({super.key});

  @override
  State<AuroraAddContactSheet> createState() => _AuroraAddContactSheetState();
}

class _AuroraAddContactSheetState extends State<AuroraAddContactSheet> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController(text: '+966');
  EmergencyContactRelation _relation = EmergencyContactRelation.family;
  bool _autoShare = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  bool get _isValid =>
      _nameCtrl.text.trim().isNotEmpty &&
      _phoneCtrl.text.trim().startsWith('+') &&
      _phoneCtrl.text.trim().length >= 8;

  @override
  Widget build(BuildContext context) {
    final padding = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      decoration: const BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AuroraRadius.xxl)),
        border: Border(
          top: BorderSide(color: AuroraColors.borderGlow),
          left: BorderSide(color: AuroraColors.border),
          right: BorderSide(color: AuroraColors.border),
        ),
      ),
      padding: EdgeInsets.only(bottom: padding),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AuroraSpacing.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 48,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AuroraColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: AuroraSpacing.lg),

              // Title
              Text('إضافة جهة طوارئ', style: AuroraText.titleLarge),
              const SizedBox(height: 4),
              Text(
                'سيُرسَل لها SMS تلقائياً عند تفعيل الطوارئ',
                style: AuroraText.bodySmall,
              ),
              const SizedBox(height: AuroraSpacing.xl),

              // Name
              _label('الاسم'),
              const SizedBox(height: AuroraSpacing.sm),
              _field(
                controller: _nameCtrl,
                hint: 'مثال: أبي',
                icon: Icons.person_outline,
              ),
              const SizedBox(height: AuroraSpacing.lg),

              // Phone
              _label('رقم الهاتف'),
              const SizedBox(height: AuroraSpacing.sm),
              _field(
                controller: _phoneCtrl,
                hint: '+966501234567',
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 4),
              Text(
                'بصيغة دولية كاملة (E.164)',
                style: AuroraText.caption,
              ),
              const SizedBox(height: AuroraSpacing.lg),

              // Relation chips
              _label('العلاقة'),
              const SizedBox(height: AuroraSpacing.sm),
              Wrap(
                spacing: AuroraSpacing.sm,
                runSpacing: AuroraSpacing.sm,
                children: EmergencyContactRelation.values.map((r) {
                  final selected = _relation == r;
                  return _relationChip(r, selected);
                }).toList(),
              ),
              const SizedBox(height: AuroraSpacing.lg),

              // Auto-share toggle
              Container(
                padding: const EdgeInsets.all(AuroraSpacing.md),
                decoration: BoxDecoration(
                  color: AuroraColors.ash,
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  border: Border.all(
                    color: _autoShare
                        ? AuroraColors.ember
                        : AuroraColors.border,
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'مشاركة الرحلات تلقائياً',
                            style: AuroraText.titleSmall.copyWith(fontSize: 14),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'تُشارَك تفاصيل كل رحلة مع هذه الجهة',
                            style: AuroraText.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: _autoShare,
                      onChanged: (v) => setState(() => _autoShare = v),
                      activeTrackColor: AuroraColors.ember,
                      activeThumbColor: AuroraColors.pearl,
                      inactiveTrackColor: AuroraColors.smoke,
                      inactiveThumbColor: AuroraColors.textHint,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: AuroraSpacing.xl),

              AuroraButton.primary(
                label: 'إضافة الجهة',
                icon: Icons.shield_outlined,
                onPressed: _isValid
                    ? () {
                        context.read<SosBloc>().add(
                              SosContactAdded(
                                name: _nameCtrl.text.trim(),
                                phoneNumber: _phoneCtrl.text.trim(),
                                relation: _relation,
                                autoShareTrips: _autoShare,
                              ),
                            );
                        Navigator.of(context).pop();
                      }
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Text(
        text,
        style: AuroraText.bodyMedium.copyWith(
          color: AuroraColors.textPrimary,
          fontWeight: FontWeight.w600,
        ),
      );

  Widget _field({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType? keyboardType,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: AuroraText.bodyLarge.copyWith(color: AuroraColors.pearl),
      onChanged: (_) => setState(() {}),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, color: AuroraColors.ember, size: 20),
      ),
    );
  }

  Widget _relationChip(EmergencyContactRelation r, bool selected) {
    return GestureDetector(
      onTap: () => setState(() => _relation = r),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(
            horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
        decoration: BoxDecoration(
          color: selected
              ? AuroraColors.ember
              : AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.pill),
          border: Border.all(
            color: selected ? AuroraColors.ember : AuroraColors.border,
            width: 1.5,
          ),
          boxShadow: selected ? AuroraShadows.iconGlow : null,
        ),
        child: Text(
          r.label,
          style: AuroraText.bodySmall.copyWith(
            color: AuroraColors.pearl,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}
