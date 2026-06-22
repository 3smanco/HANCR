import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_state.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/widgets/rider_avatar.dart';
import 'two_factor_screen.dart';
import 'devices_screen.dart';
import 'login_methods_screen.dart';
import 'security_checkup_screen.dart';
import 'edit_profile_sheet.dart';

/// AccountManagementScreen — "إدارة الحساب" بتبويبات أفقية (مستوحى من Uber Account).
class AccountManagementScreen extends StatefulWidget {
  const AccountManagementScreen({super.key});
  @override
  State<AccountManagementScreen> createState() =>
      _AccountManagementScreenState();
}

class _AccountManagementScreenState extends State<AccountManagementScreen> {
  int _tab = 0;

  // مفاتيح خصوصية محلية/إعلامية (لا بنية مشاركة بيانات فعلية في HANCR بعد)
  bool _locationSharing = true;
  bool _personalizedAds = false;
  bool _thirdPartyData = false;
  bool _deleting = false;

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
                  padding:
                      const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
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
                                  fontWeight:
                                      sel ? FontWeight.w700 : FontWeight.w500,
                                )),
                            const SizedBox(height: 6),
                            Container(
                              height: 3,
                              width: 28,
                              decoration: BoxDecoration(
                                color: sel
                                    ? AuroraColors.ember
                                    : Colors.transparent,
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
              Divider(color: AuroraColors.border, height: 1),
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
            _dash(Icons.person_outline, tr('amPersonal'),
                () => setState(() => _tab = 1)),
            const SizedBox(width: AuroraSpacing.sm),
            _dash(Icons.verified_user_outlined, tr('amSecurity'),
                () => setState(() => _tab = 2)),
            const SizedBox(width: AuroraSpacing.sm),
            _dash(Icons.lock_outline, tr('amPrivacy'),
                () => setState(() => _tab = 3)),
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
                            builder: (_) => const SecurityCheckupScreen()),
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
                  style:
                      AuroraText.caption.copyWith(color: AuroraColors.pearl)),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Personal info ───
  Widget _personal(String name, String email, String phone) {
    final hasEmail = email.isNotEmpty;
    return ListView(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      children: [
        // شارة التوثيق (مشتقة محلياً: الهاتف موثَّق دائماً بعد OTP)
        Container(
          margin: const EdgeInsets.only(bottom: AuroraSpacing.md),
          padding: const EdgeInsets.all(AuroraSpacing.md),
          decoration: BoxDecoration(
            color: AuroraColors.success.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(AuroraRadius.md),
            border:
                Border.all(color: AuroraColors.success.withValues(alpha: 0.4)),
          ),
          child: Row(
            children: [
              Icon(Icons.verified, color: AuroraColors.success, size: 20),
              const SizedBox(width: AuroraSpacing.sm),
              Expanded(
                child: Text(tr('phoneVerified'),
                    style: AuroraText.bodySmall
                        .copyWith(color: AuroraColors.pearl)),
              ),
            ],
          ),
        ),
        _infoTile(tr('fullName'), name.isEmpty ? '—' : name),
        _infoTile(tr('email'), email.isEmpty ? '—' : email, verified: hasEmail),
        _infoTile(tr('phoneNumber'), phone.isEmpty ? '—' : phone,
            verified: phone.isNotEmpty),
        const SizedBox(height: AuroraSpacing.md),
        AuroraButton.primary(
          label: tr('edit'),
          icon: Icons.edit_outlined,
          onPressed: () => showEditProfileSheet(context),
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
                  builder: (_) => TwoFactorScreen(enabled: twoFactorEnabled)))
              .then((_) => setState(() {})),
        ),
        _secNavRow(
          Icons.password_outlined,
          tr('loginMethods'),
          tr('loginMethodsSub'),
          () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const LoginMethodsScreen())),
        ),
        _secNavRow(
          Icons.devices_outlined,
          tr('myDevices'),
          tr('manageDevices'),
          () => Navigator.of(context)
              .push(MaterialPageRoute(builder: (_) => const DevicesScreen())),
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
      IconData icon, String title, String subtitle, VoidCallback onTap,
      {bool danger = false}) {
    // مُوحَّد على AuroraListRow المشترك.
    return AuroraListRow(
      icon: icon,
      title: title,
      subtitle: subtitle,
      onTap: onTap,
      danger: danger,
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
        // ─── التحكم في مشاركة البيانات (مفاتيح محلية) ───
        _privacyToggle(
          Icons.my_location_outlined,
          tr('locationSharing'),
          tr('locationSharingSub'),
          _locationSharing,
          (v) => setState(() => _locationSharing = v),
        ),
        _privacyToggle(
          Icons.hub_outlined,
          tr('thirdPartyData'),
          tr('thirdPartyDataSub'),
          _thirdPartyData,
          (v) => setState(() => _thirdPartyData = v),
        ),
        _privacyToggle(
          Icons.campaign_outlined,
          tr('personalizedAds'),
          tr('personalizedAdsSub'),
          _personalizedAds,
          (v) => setState(() => _personalizedAds = v),
        ),
        const SizedBox(height: AuroraSpacing.md),
        AuroraButton.secondary(
          label: tr('privacyPolicy'),
          icon: Icons.open_in_new,
          onPressed: () => launchUrl(
              Uri.parse('https://hancr.com/ar/legal/privacy'),
              mode: LaunchMode.externalApplication),
        ),
        const SizedBox(height: AuroraSpacing.xl),
        // ─── أدوات الخصوصية المتقدمة: حذف الحساب ───
        _secNavRow(
          Icons.delete_forever_outlined,
          tr('deleteAccount'),
          tr('deleteAccountSub'),
          _deleting ? () {} : _confirmDeleteAccount,
          danger: true,
        ),
      ],
    );
  }

  Widget _privacyToggle(IconData icon, String title, String sub, bool value,
      ValueChanged<bool> onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding:
          const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg, vertical: 4),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: AuroraColors.ember, size: 22),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: AuroraText.bodyMedium
                        .copyWith(color: AuroraColors.pearl)),
                Text(sub, style: AuroraText.caption),
              ],
            ),
          ),
          Switch(
            value: value,
            activeThumbColor: AuroraColors.ember,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDeleteAccount() async {
    // تأكيد مزدوج لخطورة الإجراء
    final first = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('deleteAccount'), style: AuroraText.titleSmall),
        content:
            Text(tr('deleteAccountConfirm1'), style: AuroraText.bodyMedium),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(tr('cancel'),
                style: TextStyle(color: AuroraColors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(tr('continue_'),
                style: TextStyle(color: AuroraColors.danger)),
          ),
        ],
      ),
    );
    if (first != true || !mounted) return;
    final second = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('deleteAccount'), style: AuroraText.titleSmall),
        content:
            Text(tr('deleteAccountConfirm2'), style: AuroraText.bodyMedium),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(tr('cancel'),
                style: TextStyle(color: AuroraColors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(tr('deleteAccount'),
                style: TextStyle(color: AuroraColors.danger)),
          ),
        ],
      ),
    );
    if (second != true || !mounted) return;
    setState(() => _deleting = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(requestAccountDeletionMutation),
      ));
      if (res.hasException) throw res.exception!;
      if (!mounted) return;
      // عند النجاح: تسجيل خروج كامل
      context.read<AuthBloc>().add(const AuthLogoutRequested());
    } catch (_) {
      if (mounted) {
        setState(() => _deleting = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(tr('loadError')),
          backgroundColor: AuroraColors.danger,
        ));
      }
    }
  }

  Widget _infoTile(String label, String value, {bool verified = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: AuroraText.caption),
                const SizedBox(height: 4),
                Text(value, style: AuroraText.bodyMedium),
              ],
            ),
          ),
          if (verified)
            Icon(Icons.check_circle, color: AuroraColors.success, size: 18),
        ],
      ),
    );
  }
}
