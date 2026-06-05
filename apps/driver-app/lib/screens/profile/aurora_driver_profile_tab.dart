import '../../core/i18n/app_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/driver/driver_bloc.dart';
import '../../blocs/driver/driver_event.dart';
import '../../blocs/driver/driver_state.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/driver_gql.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../sos/driver_emergency_contacts_screen.dart';
import '../wallet/aurora_driver_wallet_screen.dart';
import '../wallet/aurora_payout_methods_screen.dart';
import 'aurora_driver_documents_screen.dart';
import 'language_screen.dart';

void _soon(BuildContext c) => ScaffoldMessenger.of(c).showSnackBar(
      SnackBar(
          content: Text('${tr('comingSoon')} ✨'),
          backgroundColor: AuroraColors.ash),
    );

class AuroraDriverProfileTab extends StatelessWidget {
  const AuroraDriverProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        child: SafeArea(
          child: BlocBuilder<DriverBloc, DriverState>(
            builder: (ctx, state) {
              final name = state is DriverLoaded
                  ? [state.driver.firstName, state.driver.lastName]
                      .where((s) => s.isNotEmpty)
                      .join(' ')
                  : tr('driver');
              return ListView(
                padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
                children: [
                  const SizedBox(height: AuroraSpacing.md),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(tr('myAccount'), style: AuroraText.displayMedium),
                      _circleBtn(
                        icon: Icons.logout,
                        onTap: () => context
                            .read<AuthBloc>()
                            .add(const AuthLogoutRequested()),
                      ),
                    ],
                  ),
                  const SizedBox(height: AuroraSpacing.xl),

                  // User card
                  _userCard(name, state),

                  const SizedBox(height: AuroraSpacing.lg),

                  // Quick tiles
                  Row(
                    children: [
                      Expanded(child: _quickTile(
                        icon: Icons.account_balance_wallet,
                        label: tr('wallet'),
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (_) =>
                                  const AuroraDriverWalletScreen()),
                        ),
                      )),
                      const SizedBox(width: AuroraSpacing.md),
                      Expanded(child: _quickTile(
                        icon: Icons.shield,
                        label: tr('emergencyContacts'),
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (_) =>
                                  const DriverEmergencyContactsScreen()),
                        ),
                      )),
                      const SizedBox(width: AuroraSpacing.md),
                      Expanded(child: _quickTile(
                        icon: Icons.support_agent,
                        label: tr('support'),
                        onTap: () => _soon(context),
                      )),
                    ],
                  ),

                  const SizedBox(height: AuroraSpacing.lg),

                  // H3 — Driver flags (gender + verified badges)
                  if (state is DriverLoaded) _flagsSection(context, state),

                  const SizedBox(height: AuroraSpacing.lg),

                  AuroraCard(
                    padding: EdgeInsets.zero,
                    child: Column(
                      children: [
                        _menuItem(
                          icon: Icons.directions_car,
                          label: tr('carData'),
                          subtitle: state is DriverLoaded
                              ? '${state.driver.carBrand ?? ''} ${state.driver.carModel ?? ''}'.trim()
                              : '—',
                          onTap: () => _soon(context),
                        ),
                        const Divider(height: 1, color: AuroraColors.divider),
                        _menuItem(
                          icon: Icons.badge_outlined,
                          label: tr('myDocuments'),
                          subtitle: state is DriverLoaded
                              ? _approvalLabel(state.driver.approvalStatus)
                              : '—',
                          subtitleColor: state is DriverLoaded
                              ? _approvalColor(state.driver.approvalStatus)
                              : AuroraColors.textSecondary,
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  const AuroraDriverDocumentsScreen(),
                            ),
                          ),
                        ),
                        const Divider(height: 1, color: AuroraColors.divider),
                        _menuItem(
                          icon: Icons.account_balance,
                          label: tr('payout_methods'),
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  const AuroraPayoutMethodsScreen(),
                            ),
                          ),
                        ),
                        const Divider(height: 1, color: AuroraColors.divider),
                        _menuItem(
                          icon: Icons.settings,
                          label: tr('settings'),
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DriverLanguageScreen())),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: AuroraSpacing.huge),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _userCard(String name, DriverState state) {
    String phone = '';
    if (state is DriverLoaded) phone = state.driver.phoneNumber;
    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.circular(AuroraRadius.xl),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              gradient: AuroraColors.emberGradient,
              borderRadius: BorderRadius.circular(AuroraRadius.md),
              boxShadow: AuroraShadows.iconGlow,
            ),
            child: Center(
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: AuroraText.displayMedium.copyWith(
                  color: AuroraColors.pearl,
                  fontSize: 28,
                ),
              ),
            ),
          ),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: AuroraText.titleMedium),
                const SizedBox(height: 4),
                Text(phone, style: AuroraText.bodySmall),
                const SizedBox(height: AuroraSpacing.sm),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AuroraSpacing.sm, vertical: 4),
                  decoration: BoxDecoration(
                    color: AuroraColors.successBg,
                    borderRadius: BorderRadius.circular(AuroraRadius.pill),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.verified,
                          color: AuroraColors.success, size: 12),
                      const SizedBox(width: 4),
                      Text(
                        tr('verifiedDriver'),
                        style: AuroraText.caption.copyWith(
                          color: AuroraColors.success,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _quickTile({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        child: Container(
          height: 96,
          decoration: BoxDecoration(
            color: AuroraColors.ash,
            borderRadius: BorderRadius.circular(AuroraRadius.lg),
            border: Border.all(color: AuroraColors.border),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: AuroraColors.ember, size: 24),
              const SizedBox(height: 6),
              Text(
                label,
                style: AuroraText.bodySmall.copyWith(
                  color: AuroraColors.pearl,
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _menuItem({
    required IconData icon,
    required String label,
    String? subtitle,
    Color? subtitleColor,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(AuroraSpacing.md),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AuroraColors.ember.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: AuroraColors.ember, size: 20),
              ),
              const SizedBox(width: AuroraSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: AuroraText.titleSmall.copyWith(fontSize: 14)),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: AuroraText.caption.copyWith(
                          color: subtitleColor ?? AuroraColors.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.chevron_left,
                  color: AuroraColors.textSecondary, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _flagsSection(BuildContext context, DriverLoaded state) {
    final gender = state.driver.gender;
    return AuroraCard(
      padding: const EdgeInsets.all(AuroraSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Gender selector
          Text(tr('gender_label'), style: AuroraText.titleSmall),
          const SizedBox(height: AuroraSpacing.sm),
          Row(
            children: [
              Expanded(
                child: _genderChip(context, 'M',
                    tr('gender_male'), Icons.male, gender == 'M'),
              ),
              const SizedBox(width: AuroraSpacing.sm),
              Expanded(
                child: _genderChip(context, 'F',
                    tr('gender_female'), Icons.female, gender == 'F'),
              ),
            ],
          ),

          // Verified badges
          if (state.driver.kidsApproved || state.driver.nightApproved) ...[
            const SizedBox(height: AuroraSpacing.md),
            const Divider(height: 1, color: AuroraColors.divider),
            const SizedBox(height: AuroraSpacing.md),
            if (state.driver.kidsApproved)
              _verifiedBadge(Icons.school, tr('verified_kids')),
            if (state.driver.kidsApproved && state.driver.nightApproved)
              const SizedBox(height: AuroraSpacing.xs),
            if (state.driver.nightApproved)
              _verifiedBadge(
                  Icons.nightlight_round, tr('verified_night')),
          ],
        ],
      ),
    );
  }

  Widget _genderChip(BuildContext ctx, String value, String label,
      IconData icon, bool selected) {
    return InkWell(
      onTap: () => _saveGender(ctx, value),
      borderRadius: BorderRadius.circular(AuroraRadius.md),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? AuroraColors.ember.withValues(alpha: 0.12) : AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          border: Border.all(
              color: selected ? AuroraColors.ember : AuroraColors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon,
                size: 18,
                color: selected ? AuroraColors.ember : AuroraColors.pearl),
            const SizedBox(width: 6),
            Text(label,
                style: AuroraText.bodyMedium.copyWith(
                  color: selected ? AuroraColors.ember : AuroraColors.pearl,
                  fontWeight: FontWeight.w700,
                )),
          ],
        ),
      ),
    );
  }

  Future<void> _saveGender(BuildContext ctx, String value) async {
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(MutationOptions(
        document: gql(updateDriverProfileMutation),
        variables: {
          'input': {'gender': value},
        },
      ));
      if (!ctx.mounted) return;
      ctx.read<DriverBloc>().add(const DriverLoadRequested());
      ScaffoldMessenger.of(ctx).showSnackBar(
        SnackBar(content: Text(tr('saved')), backgroundColor: AuroraColors.success),
      );
    } catch (e) {
      if (!ctx.mounted) return;
      ScaffoldMessenger.of(ctx).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }
  }

  Widget _verifiedBadge(IconData icon, String label) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: AuroraColors.successBg,
            borderRadius: BorderRadius.circular(AuroraRadius.sm),
          ),
          child:
              Icon(icon, size: 14, color: AuroraColors.success),
        ),
        const SizedBox(width: AuroraSpacing.sm),
        Expanded(
          child: Text(label, style: AuroraText.bodyMedium),
        ),
        const Icon(Icons.verified, color: AuroraColors.success, size: 18),
      ],
    );
  }

  String _approvalLabel(String s) {
    switch (s) {
      case 'approved':
        return tr('approval_approved');
      case 'docs_uploaded':
        return tr('approval_docs_uploaded');
      case 'soft_reject':
        return tr('approval_soft_reject');
      case 'hard_reject':
        return tr('approval_hard_reject');
      default:
        return tr('approval_pending_docs');
    }
  }

  Color _approvalColor(String s) {
    switch (s) {
      case 'approved':
        return AuroraColors.success;
      case 'soft_reject':
      case 'hard_reject':
        return AuroraColors.danger;
      case 'docs_uploaded':
        return AuroraColors.info;
      default:
        return AuroraColors.warning;
    }
  }

  Widget _circleBtn({required IconData icon, required VoidCallback onTap}) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        shape: BoxShape.circle,
        border: Border.all(color: AuroraColors.border),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: Icon(icon, color: AuroraColors.pearl, size: 18),
        ),
      ),
    );
  }
}
