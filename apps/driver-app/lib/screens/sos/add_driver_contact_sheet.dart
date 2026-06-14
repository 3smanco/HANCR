import '../../core/i18n/app_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/sos/sos_bloc.dart';
import '../../blocs/sos/sos_event.dart';
import '../../core/models/sos_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';

/// AddDriverContactSheet — bottom-sheet لإضافة جهة طوارئ.
class AddDriverContactSheet extends StatefulWidget {
  const AddDriverContactSheet({super.key});

  @override
  State<AddDriverContactSheet> createState() => _AddDriverContactSheetState();
}

class _AddDriverContactSheetState extends State<AddDriverContactSheet> {
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

  bool get _isValid {
    return _nameCtrl.text.trim().isNotEmpty &&
        _phoneCtrl.text.trim().startsWith('+') &&
        _phoneCtrl.text.trim().length >= 8;
  }

  @override
  Widget build(BuildContext context) {
    final padding = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      decoration: const BoxDecoration(
        color: HancrColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(bottom: padding),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: HancrColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                tr('addContact'),
                style: TextStyle(
                  color: HancrColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                tr('contactSmsHint'),
                style: TextStyle(
                  color: HancrColors.textSecondary,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 20),

              TextField(
                controller: _nameCtrl,
                textCapitalization: TextCapitalization.words,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  labelText: tr('name'),
                  hintText: tr('nameExample'),
                  prefixIcon: const Icon(Icons.person_outline),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  labelText: tr('phoneNumber'),
                  hintText: '+966501234567',
                  prefixIcon: const Icon(Icons.phone_outlined),
                  helperText: tr('e164Hint'),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // ───── Relation selector ─────
              Text(
                tr('relation'),
                style: TextStyle(
                  color: HancrColors.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: EmergencyContactRelation.values.map((r) {
                  final selected = _relation == r;
                  return GestureDetector(
                    onTap: () => setState(() => _relation = r),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: selected
                            ? HancrColors.violet
                            : HancrColors.surfaceMute,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: selected
                              ? HancrColors.violet
                              : HancrColors.border,
                        ),
                      ),
                      child: Text(
                        r.label,
                        style: TextStyle(
                          color: selected
                              ? Colors.white
                              : HancrColors.textPrimary,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              // ───── Auto-share toggle ─────
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: HancrColors.surfaceMute,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _autoShare,
                  onChanged: (v) => setState(() => _autoShare = v),
                  activeColor: HancrColors.violet,
                  title: Text(
                    tr('autoShareRides'),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  subtitle: Text(
                    tr('autoShareSub'),
                    style: TextStyle(
                      fontSize: 11,
                      color: HancrColors.textSecondary,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              HancrButton.primary(
                label: tr('addThisContact'),
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
                icon: Icons.shield_outlined,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
