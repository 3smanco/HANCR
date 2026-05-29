import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/driver/driver_bloc.dart';
import '../../blocs/driver/driver_state.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../sos/driver_emergency_contacts_screen.dart';
import '../wallet/aurora_driver_wallet_screen.dart';

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
                  : 'السائق';
              return ListView(
                padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
                children: [
                  const SizedBox(height: AuroraSpacing.md),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('حسابي', style: AuroraText.displayMedium),
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
                        label: 'محفظة',
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (_) =>
                                  const AuroraDriverWalletScreen()),
                        ),
                      )),
                      const SizedBox(width: AuroraSpacing.md),
                      Expanded(child: _quickTile(
                        icon: Icons.shield,
                        label: 'جهات الطوارئ',
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (_) =>
                                  const DriverEmergencyContactsScreen()),
                        ),
                      )),
                      const SizedBox(width: AuroraSpacing.md),
                      Expanded(child: _quickTile(
                        icon: Icons.support_agent,
                        label: 'دعم',
                        onTap: () {},
                      )),
                    ],
                  ),

                  const SizedBox(height: AuroraSpacing.lg),

                  AuroraCard(
                    padding: EdgeInsets.zero,
                    child: Column(
                      children: [
                        _menuItem(
                          icon: Icons.directions_car,
                          label: 'بيانات السيارة',
                          subtitle: state is DriverLoaded
                              ? '${state.driver.carBrand ?? ''} ${state.driver.carModel ?? ''}'.trim()
                              : '—',
                          onTap: () {},
                        ),
                        const Divider(height: 1, color: AuroraColors.divider),
                        _menuItem(
                          icon: Icons.badge_outlined,
                          label: 'بيانات الرخصة',
                          subtitle: 'موثَّق ✓',
                          onTap: () {},
                          subtitleColor: AuroraColors.success,
                        ),
                        const Divider(height: 1, color: AuroraColors.divider),
                        _menuItem(
                          icon: Icons.settings,
                          label: 'الإعدادات',
                          onTap: () {},
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
                        'سائق موثَّق',
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
