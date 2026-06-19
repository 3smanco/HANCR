import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_event.dart';
import '../../blocs/rider/rider_state.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/widgets/rider_avatar.dart';

/// مودال تعديل البيانات الشخصية (bottom sheet) — يعيد استخدام منطق الحفظ
/// (RiderUpdateRequested) بدل دفع شاشة كاملة. مطابق لوصف Uber للدفعة الثالثة.
Future<void> showEditProfileSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AuroraColors.coal,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AuroraRadius.lg)),
    ),
    builder: (_) => const _EditProfileSheet(),
  );
}

class _EditProfileSheet extends StatefulWidget {
  const _EditProfileSheet();
  @override
  State<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<_EditProfileSheet> {
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  bool _seeded = false;

  void _seed(RiderState state) {
    if (_seeded || state is! RiderLoaded) return;
    _first.text = state.rider.firstName ?? '';
    _last.text = state.rider.lastName ?? '';
    _email.text = state.rider.email ?? '';
    _seeded = true;
  }

  void _save() {
    context.read<RiderBloc>().add(RiderUpdateRequested(
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim().isEmpty ? null : _email.text.trim(),
        ));
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(tr('saved')),
      backgroundColor: AuroraColors.success,
    ));
    Navigator.of(context).maybePop();
  }

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: BlocBuilder<RiderBloc, RiderState>(
        builder: (context, state) {
          _seed(state);
          final name =
              [_first.text, _last.text].where((s) => s.isNotEmpty).join(' ');
          final avatarUrl = state is RiderLoaded ? state.rider.avatarUrl : null;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: AuroraSpacing.lg),
                  decoration: BoxDecoration(
                    color: AuroraColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Text(tr('editProfile'), style: AuroraText.titleMedium),
                const SizedBox(height: AuroraSpacing.lg),
                RiderAvatar(
                  avatarUrl: avatarUrl,
                  initial: name.isNotEmpty ? name[0].toUpperCase() : '?',
                  size: 80,
                ),
                const SizedBox(height: AuroraSpacing.lg),
                _field(tr('firstName'), _first, Icons.person_outline),
                const SizedBox(height: AuroraSpacing.md),
                _field(tr('lastName'), _last, Icons.person_outline),
                const SizedBox(height: AuroraSpacing.md),
                _field(tr('email'), _email, Icons.mail_outline,
                    keyboard: TextInputType.emailAddress),
                const SizedBox(height: AuroraSpacing.xl),
                AuroraButton.primary(
                    label: tr('save'), icon: Icons.check, onPressed: _save),
                const SizedBox(height: AuroraSpacing.sm),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _field(String label, TextEditingController c, IconData icon,
      {TextInputType? keyboard}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AuroraText.bodySmall),
        const SizedBox(height: 6),
        TextField(
          controller: c,
          keyboardType: keyboard,
          style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: AuroraColors.textSecondary, size: 20),
            filled: true,
            fillColor: AuroraColors.ash,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AuroraRadius.md),
              borderSide: const BorderSide(color: AuroraColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AuroraRadius.md),
              borderSide: BorderSide(color: AuroraColors.ember, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}
