import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_state.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../sos/aurora_emergency_contacts_screen.dart';
import '../wallet/aurora_wallet_screen.dart';

/// AuroraProfileTab — مستوحاة من تصميمك:
///  - User card في الأعلى (avatar + name + email + crown + Edit/Add Device)
///  - Quick actions row (Help/Wallet/Activity) — 3 tiles
///  - Promo cards (Try HANCR One, Safety checkup, CO2 saved, Invite friends)
class AuroraProfileTab extends StatelessWidget {
  const AuroraProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return AuroraBackground(
      child: SafeArea(
        bottom: false,
        child: BlocBuilder<RiderBloc, RiderState>(
          builder: (context, state) {
            return ListView(
              padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
              children: [
                const SizedBox(height: AuroraSpacing.md),

                // ─── Header row ───
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('حسابي', style: AuroraText.displayMedium),
                    _circleIconButton(
                      icon: Icons.logout,
                      onTap: () =>
                          context.read<AuthBloc>().add(const AuthLogoutRequested()),
                    ),
                  ],
                ),

                const SizedBox(height: AuroraSpacing.xl),

                // ─── User profile card ───
                _userCard(state, context),

                const SizedBox(height: AuroraSpacing.lg),

                // ─── Quick actions ───
                Row(
                  children: [
                    Expanded(
                      child: _quickTile(
                        icon: Icons.support_agent_outlined,
                        label: 'مساعدة',
                        onTap: () => AuroraToast.comingSoon(context,
                            feature: 'مركز الدعم'),
                      ),
                    ),
                    const SizedBox(width: AuroraSpacing.md),
                    Expanded(
                      child: _quickTile(
                        icon: Icons.account_balance_wallet_outlined,
                        label: 'محفظة',
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (_) => const AuroraWalletScreen()),
                        ),
                      ),
                    ),
                    const SizedBox(width: AuroraSpacing.md),
                    Expanded(
                      child: _quickTile(
                        icon: Icons.receipt_long_outlined,
                        label: 'النشاط',
                        onTap: () => AuroraToast.comingSoon(context,
                            feature: 'سجل الرحلات'),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: AuroraSpacing.lg),

                // ─── Promo cards ───
                _promoCard(
                  title: 'جرِّب HANCR Premium مجاناً',
                  subtitle: 'احصل على 6% Cashback على رحلاتك وأكثر',
                  icon: Icons.workspace_premium,
                  gradient: [AuroraColors.ember, AuroraColors.emberDeep],
                ),
                const SizedBox(height: AuroraSpacing.md),

                _checkupCard(
                  title: 'فحص الأمان',
                  subtitle: 'فعِّل ميزات الأمان الإضافية',
                  progress: 1,
                  total: 7,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(
                        builder: (_) =>
                            const AuroraEmergencyContactsScreen()),
                  ),
                ),
                const SizedBox(height: AuroraSpacing.md),

                _simpleCard(
                  title: 'فحص الخصوصية',
                  subtitle: 'جولة تفاعلية لإعدادات خصوصيتك',
                  icon: Icons.shield_outlined,
                ),
                const SizedBox(height: AuroraSpacing.md),

                _statCard(
                  title: 'CO₂ موفَّر',
                  trailing: '0 ج',
                  icon: Icons.eco_outlined,
                  iconColor: AuroraColors.success,
                ),
                const SizedBox(height: AuroraSpacing.md),

                _simpleCard(
                  title: 'ادعُ أصدقاءك',
                  subtitle: 'يحصل كلٌّ منكم على خصم 50٪ على رحلتين',
                  icon: Icons.card_giftcard,
                ),

                const SizedBox(height: AuroraSpacing.huge),
              ],
            );
          },
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  Widget _userCard(RiderState state, BuildContext context) {
    String name = 'مستخدم HANCR';
    String email = 'user@hancr.com';
    if (state is RiderLoaded) {
      final r = state.rider;
      name = [r.firstName, r.lastName].where((s) => s != null && s.isNotEmpty).join(' ');
      if (name.isEmpty) name = r.phoneNumber;
      email = r.email ?? r.phoneNumber;
    }
    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AuroraColors.smoke,
            AuroraColors.coal,
          ],
        ),
        borderRadius: BorderRadius.circular(AuroraRadius.xl),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AuroraRadius.md),
              gradient: AuroraColors.emberGradient,
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
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        name,
                        style: AuroraText.titleMedium.copyWith(fontSize: 18),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: AuroraSpacing.xs),
                    Icon(Icons.workspace_premium,
                        color: AuroraColors.gold, size: 18),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.mail_outline,
                        color: AuroraColors.textHint, size: 13),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        email,
                        style: AuroraText.bodySmall,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AuroraSpacing.md),
                Row(
                  children: [
                    _smallPill(
                      icon: Icons.edit_outlined,
                      label: 'تعديل',
                      onTap: () => AuroraToast.comingSoon(context,
                          feature: 'تعديل الملف الشخصي'),
                    ),
                    const SizedBox(width: AuroraSpacing.sm),
                    _smallPill(
                      icon: Icons.add_circle_outline,
                      label: 'إضافة جهاز',
                      onTap: () => AuroraToast.comingSoon(context,
                          feature: 'إضافة جهاز'),
                      primary: true,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _smallPill({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool primary = false,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AuroraRadius.pill),
        child: Container(
          padding: const EdgeInsets.symmetric(
              horizontal: AuroraSpacing.md, vertical: 6),
          decoration: BoxDecoration(
            color: primary
                ? AuroraColors.ember
                : AuroraColors.ash,
            borderRadius: BorderRadius.circular(AuroraRadius.pill),
            border: Border.all(
              color: primary ? AuroraColors.ember : AuroraColors.border,
            ),
            boxShadow: primary ? AuroraShadows.iconGlow : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 14,
                color: primary ? AuroraColors.pearl : AuroraColors.ember,
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: AuroraText.caption.copyWith(
                  color: AuroraColors.pearl,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
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
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: AuroraShadows.iconGlow,
                ),
                child: Icon(icon, color: AuroraColors.ember, size: 22),
              ),
              const SizedBox(height: AuroraSpacing.sm),
              Text(
                label,
                style: AuroraText.bodyMedium.copyWith(
                  color: AuroraColors.pearl,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _promoCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required List<Color> gradient,
  }) {
    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [gradient[0].withValues(alpha: 0.25), AuroraColors.coal],
        ),
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(color: gradient[0].withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AuroraText.titleSmall),
                const SizedBox(height: 4),
                Text(subtitle, style: AuroraText.bodySmall),
              ],
            ),
          ),
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: gradient),
              shape: BoxShape.circle,
              boxShadow: AuroraShadows.iconGlow,
            ),
            child: Icon(icon, color: AuroraColors.pearl, size: 28),
          ),
        ],
      ),
    );
  }

  Widget _checkupCard({
    required String title,
    required String subtitle,
    required int progress,
    required int total,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        child: Container(
          padding: const EdgeInsets.all(AuroraSpacing.lg),
          decoration: BoxDecoration(
            color: AuroraColors.ash,
            borderRadius: BorderRadius.circular(AuroraRadius.lg),
            border: Border.all(color: AuroraColors.border),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: AuroraText.titleSmall),
                    const SizedBox(height: 4),
                    Text(subtitle, style: AuroraText.bodySmall),
                  ],
                ),
              ),
              SizedBox(
                width: 56,
                height: 56,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 56,
                      height: 56,
                      child: CircularProgressIndicator(
                        value: progress / total,
                        strokeWidth: 4,
                        backgroundColor: AuroraColors.smoke,
                        valueColor: const AlwaysStoppedAnimation(AuroraColors.ember),
                      ),
                    ),
                    Text(
                      '$progress/$total',
                      style: AuroraText.bodySmall.copyWith(
                        color: AuroraColors.ember,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _simpleCard({
    required String title,
    required String subtitle,
    required IconData icon,
  }) {
    return AuroraCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AuroraText.titleSmall),
                const SizedBox(height: 4),
                Text(subtitle, style: AuroraText.bodySmall),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(AuroraSpacing.md),
            decoration: BoxDecoration(
              color: AuroraColors.smoke,
              shape: BoxShape.circle,
              boxShadow: AuroraShadows.iconGlow,
            ),
            child: Icon(icon, color: AuroraColors.ember, size: 22),
          ),
        ],
      ),
    );
  }

  Widget _statCard({
    required String title,
    required String trailing,
    required IconData icon,
    required Color iconColor,
  }) {
    return AuroraCard(
      child: Row(
        children: [
          Expanded(child: Text(title, style: AuroraText.titleSmall)),
          Icon(icon, color: iconColor, size: 20),
          const SizedBox(width: AuroraSpacing.sm),
          Text(
            trailing,
            style: AuroraText.titleSmall.copyWith(color: AuroraColors.pearl),
          ),
        ],
      ),
    );
  }

  Widget _circleIconButton({required IconData icon, required VoidCallback onTap}) {
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
