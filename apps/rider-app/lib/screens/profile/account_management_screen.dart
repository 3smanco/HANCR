import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_state.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/widgets/rider_avatar.dart';
import '../sos/aurora_safety_hub_screen.dart';
import 'profile_pages.dart';
import 'two_factor_screen.dart';
import 'devices_screen.dart';

/// AccountManagementScreen — "إدارة الحساب" بتبويبات أفقية (مستوحى من Uber Account).
class AccountManagementScreen extends StatefulWidget {
  const AccountManagementScreen({super.key});
  @override
  State<AccountManagementScreen> createState() =>
      _AccountManagementScreenState();
}

class _AccountManagementScreenState extends State<AccountManagementScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final tabs = [
      tr('amHome'),
      tr('amPersonal'),
      tr('amSecurity'),
      tr('amPrivacy'),
    ];
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('manageAccount'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              // ─── شريط تبويبات أفقي قابل للتمرير ───
              SizedBox(
                height: 48,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                      horizontal: AuroraSpacing.lg),
                  itemCount: tabs.length,
                  itemBuilder: (_, i) {
                    final sel = _tab == i;
                    return GestureDetector(
                      onTap: () => setState(() => _tab = i),
                      child: Container(
                        margin: const EdgeInsets.only(right: AuroraSpacing.lg),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(tabs[i],
                                style: AuroraText.titleSmall.copyWith(
                                  color: sel
                                      ? AuroraColors.pearl
                                      : AuroraColors.textSecondary,
                                  fontWeight: sel
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                )),
                            const SizedBox(height: 6),
                            Container(
                              height: 3,
                              width: 28,
                              decoration: BoxDecoration(
                                color:
                                    sel ? AuroraColors.ember : Colors.transparent,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const Divider(color: AuroraColors.border, height: 1),
              Expanded(
                child: BlocBuilder<RiderBloc, RiderState>(
                  builder: (context, state) {
                    String name = tr('hancrUser');
                    String email = '';
                    String phone = '';
                    String? avatar;
                    if (state is RiderLoaded) {
                      final r = state.rider;
                      name = [r.firstName, r.lastName]
                          .where((s) => s != null && s.isNotEmpty)
                          .join(' ');
                      if (name.isEmpty) name = r.phoneNumber;
                      email = r.email ?? '';
                      phone = r.phoneNumber;
                      avatar = r.avatarUrl;
                    }
                    final twoFa = state is RiderLoaded
                        ? state.rider.twoFactorEnabled
                        : false;
                    switch (_tab) {
                      case 1:
                        return _personal(name, email, phone);
                      case 2:
                        return _security(twoFa);
                      case 3:
                        return _privacy();
                      default:
                        return _home(name, email, avatar);
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Home ───
  Widget _home(String name, String email, String? avatar) {
    return ListView(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      children: [
        const SizedBox(height: AuroraSpacing.md),
        Center(
          child: RiderAvatar(
              avatarUrl: avatar,
              initial: name.isNotEmpty ? name[0].toUpperCase() : '?',
              size: 96),
        ),
        const SizedBox(height: AuroraSpacing.md),
        Center(child: Text(name, style: AuroraText.titleLarge)),
        if (email.isNotEmpty)
          Center(child: Text(email, style: AuroraText.bodySmall)),
        const SizedBox(height: AuroraSpacing.xl),
        Row(
          children: [
            _dash(Icons.person_outline, tr('amPersonal'), () => setState(() => _tab = 1)),
            const SizedBox(width: AuroraSpacing.sm),
            _dash(Icons.verified_user_outlined, tr('amSecurity'), () => setState(() => _tab = 2)),
            const SizedBox(width: AuroraSpacing.sm),
            _dash(Icons.lock_outline, tr('amPrivacy'), () => setState(() => _tab = 3)),
          ],
        ),
        const SizedBox(height: AuroraSpacing.xl),
        Text(tr('suggestions'), style: AuroraText.titleMedium),
        const SizedBox(height: AuroraSpacing.md),
        Container(
          decoration: BoxDecoration(
            color: AuroraColors.ash,
            borderRadius: BorderRadius.circular(AuroraRadius.lg),
            border: Border.all(color: AuroraColors.border),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              Image.asset('assets/images/account-checkup.png',
                  height: 150, width: double.infinity, fit: BoxFit.cover),
              Padding(
                padding: const EdgeInsets.all(AuroraSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(tr('checkupTitle'), style: AuroraText.titleSmall),
                    const SizedBox(height: 4),
                    Text(tr('checkupSub'), style: AuroraText.bodySmall),
                    const SizedBox(height: AuroraSpacing.md),
                    AuroraButton.primary(
                      label: tr('beginCheckup'),
                      fullWidth: false,
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const AuroraSafetyHubScreen()),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _dash(IconData icon, String label, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AuroraSpacing.lg),
          decoration: BoxDecoration(
            color: AuroraColors.ash,
            borderRadius: BorderRadius.circular(AuroraRadius.md),
            border: Border.all(color: AuroraColors.border),
          ),
          child: Column(
            children: [
              Icon(icon, color: AuroraColors.ember, size: 24),
              const SizedBox(height: AuroraSpacing.sm),
              Text(label,
                  textAlign: TextAlign.center,
                  style: AuroraText.caption.copyWith(color: AuroraColors.pearl)),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Personal info ───
  Widget _personal(String name, String email, String phone) {
    return ListView(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      children: [
        _infoTile(tr('fullName'), name.isEmpty ? '—' : name),
        _infoTile(tr('email'), email.isEmpty ? '—' : email),
        _infoTile(tr('phoneNumber'), phone.isEmpty ? '—' : phone),
        const SizedBox(height: AuroraSpacing.md),
        AuroraButton.primary(
          label: tr('edit'),
          icon: Icons.edit_outlined,
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const EditProfileScreen()),
          ),
        ),
      ],
    );
  }

  // ─── Security ───
  Widget _security(bool twoFactorEnabled) {
    return ListView(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      children: [
        _infoTile(tr('signInMethod'), tr('signInPhone')),
        const SizedBox(height: AuroraSpacing.md),
        _secNavRow(
          Icons.verified_user_outlined,
          tr('twoFactor'),
          twoFactorEnabled ? tr('twoFaOn') : tr('twoFaOff'),
          () => Navigator.of(context)
              .push(MaterialPageRoute(
                  builder: (_) =>
                      TwoFactorScreen(enabled: twoFactorEnabled)))
              .then((_) => setState(() {})),
        ),
        _secNavRow(
          Icons.devices_outlined,
          tr('myDevices'),
          tr('manageDevices'),
          () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const DevicesScreen())),
        ),
        const SizedBox(height: AuroraSpacing.md),
        Text(tr('securityInfo'),
            style: AuroraText.bodySmall.copyWith(height: 1.5)),
        const SizedBox(height: AuroraSpacing.lg),
        AuroraButton.secondary(
          label: tr('signOutEverywhere'),
          icon: Icons.logout,
          onPressed: () =>
              context.read<AuthBloc>().add(const AuthLogoutRequested()),
        ),
      ],
    );
  }

  Widget _secNavRow(
      IconData icon, String title, String subtitle, VoidCallback onTap) {
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
        trailing: const Icon(Icons.chevron_left,
            color: AuroraColors.textSecondary),
        onTap: onTap,
      ),
    );
  }

  // ─── Privacy & data ───
  Widget _privacy() {
    return ListView(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      children: [
        Text(tr('privacyDataInfo'),
            style: AuroraText.bodySmall.copyWith(height: 1.5)),
        const SizedBox(height: AuroraSpacing.lg),
        AuroraButton.secondary(
          label: tr('privacyPolicy'),
          icon: Icons.open_in_new,
          onPressed: () => launchUrl(
              Uri.parse('https://hancr.com/ar/legal/privacy'),
              mode: LaunchMode.externalApplication),
        ),
      ],
    );
  }

  Widget _infoTile(String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AuroraText.caption),
          const SizedBox(height: 4),
          Text(value, style: AuroraText.bodyMedium),
        ],
      ),
    );
  }
}
