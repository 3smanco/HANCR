import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/driver/driver_bloc.dart';
import '../../blocs/driver/driver_event.dart';
import '../../blocs/driver/driver_state.dart';
import '../../core/theme/app_theme.dart';
import '../../core/i18n/app_localization.dart';
import '../sos/driver_emergency_contacts_screen.dart';

class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});
  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  bool _editing = false;
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  final _brandCtrl = TextEditingController();
  final _modelCtrl = TextEditingController();
  final _colorCtrl = TextEditingController();
  final _plateCtrl = TextEditingController();

  @override
  void dispose() {
    _firstCtrl.dispose();
    _lastCtrl.dispose();
    _brandCtrl.dispose();
    _modelCtrl.dispose();
    _colorCtrl.dispose();
    _plateCtrl.dispose();
    super.dispose();
  }

  void _startEdit(DriverLoaded state) {
    final d = state.driver;
    _firstCtrl.text = d.firstName;
    _lastCtrl.text = d.lastName;
    _brandCtrl.text = d.carBrand ?? '';
    _modelCtrl.text = d.carModel ?? '';
    _colorCtrl.text = d.carColor ?? '';
    _plateCtrl.text = d.plateNumber ?? '';
    setState(() => _editing = true);
  }

  void _save() {
    context.read<DriverBloc>().add(
          DriverUpdateRequested(
            firstName: _firstCtrl.text.trim().isEmpty
                ? null
                : _firstCtrl.text.trim(),
            lastName: _lastCtrl.text.trim().isEmpty
                ? null
                : _lastCtrl.text.trim(),
            carBrand: _brandCtrl.text.trim().isEmpty
                ? null
                : _brandCtrl.text.trim(),
            carModel: _modelCtrl.text.trim().isEmpty
                ? null
                : _modelCtrl.text.trim(),
            carColor: _colorCtrl.text.trim().isEmpty
                ? null
                : _colorCtrl.text.trim(),
            plateNumber: _plateCtrl.text.trim().isEmpty
                ? null
                : _plateCtrl.text.trim(),
          ),
        );
    setState(() => _editing = false);
  }

  void _showComingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(tr('comingSoon'))),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(tr('profile')),
        actions: [
          BlocBuilder<DriverBloc, DriverState>(
            builder: (ctx, state) {
              if (state is! DriverLoaded) return const SizedBox.shrink();
              return TextButton(
                onPressed: _editing ? _save : () => _startEdit(state),
                child: Text(_editing ? tr('save') : tr('edit')),
              );
            },
          ),
        ],
      ),
      body: BlocBuilder<DriverBloc, DriverState>(
        builder: (ctx, state) {
          if (state is DriverLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is DriverError) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(state.message),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => ctx
                        .read<DriverBloc>()
                        .add(const DriverLoadRequested()),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }
          if (state is DriverLoaded) return _buildProfile(ctx, state);
          return const Center(child: CircularProgressIndicator());
        },
      ),
    );
  }

  Widget _buildProfile(BuildContext ctx, DriverLoaded state) {
    final d = state.driver;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Avatar
          Center(
            child: Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: HancrColors.primary,
                borderRadius: BorderRadius.circular(26),
              ),
              child: Center(
                child: Text(
                  d.displayName.isNotEmpty ? d.displayName[0].toUpperCase() : '?',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 40,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (!_editing) ...[
            Text(d.displayName,
                style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 4),
            Text(d.phoneNumber,
                style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 8),
            // Car info
            if (d.carBrand != null)
              Text(
                d.carDescription,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            if (d.plateNumber != null) ...[
              const SizedBox(height: 4),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: HancrColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  d.plateNumber!,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            ],
          ] else ...[
            _EditField(ctrl: _firstCtrl, label: 'First name'),
            const SizedBox(height: 12),
            _EditField(ctrl: _lastCtrl, label: 'Last name'),
            const SizedBox(height: 20),
            Text('Car info',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            _EditField(ctrl: _brandCtrl, label: 'Brand'),
            const SizedBox(height: 12),
            _EditField(ctrl: _modelCtrl, label: 'Model'),
            const SizedBox(height: 12),
            _EditField(ctrl: _colorCtrl, label: 'Color'),
            const SizedBox(height: 12),
            _EditField(ctrl: _plateCtrl, label: 'Plate number'),
          ],
          const SizedBox(height: 28),
          if (!_editing) ...[
            _MenuItem(
              icon: Icons.shield_outlined,
              label: 'جهات الطوارئ',
              iconColor: HancrColors.success,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const DriverEmergencyContactsScreen(),
                  ),
                );
              },
            ),
            _MenuItem(
              icon: Icons.help_outline,
              label: tr('help_support'),
              onTap: () => _showComingSoon(context),
            ),
            _MenuItem(
              icon: Icons.privacy_tip_outlined,
              label: tr('privacy_policy'),
              onTap: () => _showComingSoon(context),
            ),
            const SizedBox(height: 12),
            _MenuItem(
              icon: Icons.logout,
              label: tr('logout'),
              iconColor: HancrColors.error,
              labelColor: HancrColors.error,
              onTap: () => _confirmLogout(context),
            ),
          ],
          const SizedBox(height: 32),
          Text(
            'HANCR Captain v1.0.0 · Zancr LLC',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontSize: 11,
                  color: HancrColors.textHint,
                ),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Sign out?'),
        content: const Text('You will need to sign in again.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: HancrColors.error),
            child: const Text('Sign out'),
          ),
        ],
      ),
    ).then((confirmed) {
      if (confirmed == true && context.mounted) {
        context.read<AuthBloc>().add(const AuthLogoutRequested());
      }
    });
  }
}

class _EditField extends StatelessWidget {
  final TextEditingController ctrl;
  final String label;
  const _EditField({required this.ctrl, required this.label});

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: ctrl,
      decoration: InputDecoration(labelText: label),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? labelColor;
  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.iconColor,
    this.labelColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: HancrColors.divider),
      ),
      child: ListTile(
        leading: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color:
                (iconColor ?? HancrColors.primary).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon,
              color: iconColor ?? HancrColors.primary, size: 20),
        ),
        title: Text(
          label,
          style: Theme.of(context)
              .textTheme
              .titleMedium
              ?.copyWith(color: labelColor),
        ),
        trailing: const Icon(
          Icons.chevron_right,
          color: HancrColors.textHint,
          size: 20,
        ),
        onTap: onTap,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
