import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_state.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/widgets/rider_avatar.dart';
import '../sos/aurora_safety_hub_screen.dart';
import '../inbox/aurora_inbox_screen.dart';
import '../family/aurora_family_manage_screen.dart';
import 'co2_details_screen.dart';
import '../wallet/aurora_wallet_screen.dart';
import '../wallet/payment_methods_screen.dart';
import '../rides/aurora_rides.dart';
import '../loyalty/loyalty_tab.dart';
import '../commuter/aurora_commuter_screen.dart';
import 'profile_pages.dart';
import 'aurora_saved_places_screen.dart';
import 'account_management_screen.dart';
import 'saved_groups_screen.dart';
import 'ride_profiles_screen.dart';
import 'support_screen.dart';
import 'earn_driving_screen.dart';
import 'simple_mode_screen.dart';
import 'legal_screen.dart';
import '../../core/account_version.dart';

void _open(BuildContext context, Widget page) {
  Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
}

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
              // حشوة سفلية تتجاوز الشريط السفلي العائم (extendBody:true) + الـ safe-area
              // حتى لا تختفي آخر بطاقة (ادعُ أصدقاءك) خلفه.
              padding: EdgeInsets.fromLTRB(
                AuroraSpacing.lg,
                0,
                AuroraSpacing.lg,
                AuroraBottomNav.height +
                    MediaQuery.of(context).viewPadding.bottom +
                    AuroraSpacing.lg,
              ),
              children: [
                const SizedBox(height: AuroraSpacing.md),

                // ─── Header row ───
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(tr('myAccount'), style: AuroraText.displayMedium),
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

                // ─── Quick actions (2×2 grid) ───
                Row(
                  children: [
                    Expanded(
                      child: _quickTile(
                        icon: Icons.support_agent_outlined,
                        label: tr('help'),
                        onTap: () => _open(context, const HelpCenterScreen()),
                      ),
                    ),
                    const SizedBox(width: AuroraSpacing.md),
                    Expanded(
                      child: _quickTile(
                        icon: Icons.account_balance_wallet_outlined,
                        label: tr('wallet'),
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (_) => const AuroraWalletScreen()),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AuroraSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: _quickTile(
                        icon: Icons.receipt_long_outlined,
                        label: tr('nav_activity'),
                        onTap: () => _open(context, const RidesHistoryScreen()),
                      ),
                    ),
                    const SizedBox(width: AuroraSpacing.md),
                    Expanded(
                      child: _quickTile(
                        icon: Icons.mail_outline,
                        label: tr('inbox'),
                        onTap: () => _open(context, const AuroraInboxScreen()),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: AuroraSpacing.lg),

                // ─── HANCR Miles (الولاء) ───
                _promoCard(
                  title: 'HANCR Miles',
                  subtitle: tr('milesSub'),
                  icon: Icons.military_tech,
                  gradient: [AuroraColors.gold, AuroraColors.ember],
                  onTap: () => _open(context, const LoyaltyTab()),
                ),
                const SizedBox(height: AuroraSpacing.md),

                _checkupCard(
                  title: tr('safetyCheck'),
                  subtitle: tr('safetyCheckSub'),
                  progress: 1,
                  total: 7,
                  onTap: () => _open(context, const AuroraSafetyHubScreen()),
                ),
                const SizedBox(height: AuroraSpacing.md),

                _simpleCard(
                  title: tr('savedPlaces'),
                  subtitle: tr('savedPlacesSub'),
                  icon: Icons.bookmark_outline,
                  onTap: () => _open(context, const AuroraSavedPlacesScreen()),
                ),
                const SizedBox(height: AuroraSpacing.md),

                _simpleCard(
                  title: tr('settingsPrivacy'),
                  subtitle: tr('settingsPrivacySub'),
                  icon: Icons.shield_outlined,
                  onTap: () => _open(context, const SettingsScreen()),
                ),
                const SizedBox(height: AuroraSpacing.md),

                _simpleCard(
                  title: tr('family'),
                  subtitle: tr('familySub'),
                  icon: Icons.family_restroom_outlined,
                  onTap: () =>
                      _open(context, const AuroraFamilyManageScreen()),
                ),
                const SizedBox(height: AuroraSpacing.md),

                _statCard(
                  title: tr('co2Saved'),
                  trailing: tr('viewDetails'),
                  icon: Icons.eco_outlined,
                  iconColor: AuroraColors.success,
                  onTap: () => _open(context, const Co2DetailsScreen()),
                ),
                const SizedBox(height: AuroraSpacing.md),

                _simpleCard(
                  title: tr('inviteFriends'),
                  subtitle: tr('inviteSub'),
                  icon: Icons.card_giftcard,
                  onTap: () => _open(context, const InviteFriendsScreen()),
                ),

                const SizedBox(height: AuroraSpacing.lg),
                // ─── قائمة الحساب الطويلة (نمط Uber) ───
                Text(tr('more'), style: AuroraText.titleSmall),
                const SizedBox(height: AuroraSpacing.sm),
                AuroraListRow(
                  icon: Icons.commute_outlined,
                  title: tr('commuteAlerts'),
                  onTap: () => _open(context, const AuroraCommuterScreen()),
                ),
                AuroraListRow(
                  icon: Icons.groups_outlined,
                  title: tr('savedGroups'),
                  badge: tr('badgeNew'),
                  onTap: () => _open(context, const SavedGroupsScreen()),
                ),
                AuroraListRow(
                  icon: Icons.swap_horiz,
                  title: tr('rideProfiles'),
                  onTap: () => _open(context, const RideProfilesScreen()),
                ),
                AuroraListRow(
                  icon: Icons.credit_card_outlined,
                  title: tr('paymentMethods'),
                  onTap: () => _open(context, const PaymentMethodsScreen()),
                ),
                AuroraListRow(
                  icon: Icons.directions_car_outlined,
                  title: tr('earnDriving'),
                  onTap: () => _open(context, const EarnDrivingScreen()),
                ),
                AuroraListRow(
                  icon: Icons.support_agent_outlined,
                  title: tr('support'),
                  onTap: () => _open(context, const SupportScreen()),
                ),
                AuroraListRow(
                  icon: Icons.manage_accounts_outlined,
                  title: tr('manageAccount'),
                  onTap: () =>
                      _open(context, const AccountManagementScreen()),
                ),
                AuroraListRow(
                  icon: Icons.elderly_outlined,
                  title: tr('simpleMode'),
                  badge: tr('badgeNew'),
                  onTap: () => _open(context, const SimpleModeScreen()),
                ),
                AuroraListRow(
                  icon: Icons.gavel_outlined,
                  title: tr('legal'),
                  onTap: () => _open(context, const LegalScreen()),
                ),
                const SizedBox(height: AuroraSpacing.md),
                Center(
                  child: FutureBuilder<String>(
                    future: AccountVersion.label(),
                    builder: (context, snap) => Text(
                      snap.data ?? '',
                      style: AuroraText.caption
                          .copyWith(color: AuroraColors.textHint),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  Widget _userCard(RiderState state, BuildContext context) {
    String name = tr('hancrUser');
    String email = 'user@hancr.com';
    String? avatarUrl;
    if (state is RiderLoaded) {
      final r = state.rider;
      name = [r.firstName, r.lastName].where((s) => s != null && s.isNotEmpty).join(' ');
      if (name.isEmpty) name = r.phoneNumber;
      email = r.email ?? r.phoneNumber;
      avatarUrl = r.avatarUrl;
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
          // Avatar (عرض الصورة + التقاط/رفع صورة جديدة)
          RiderAvatar(
            avatarUrl: avatarUrl,
            initial: name.isNotEmpty ? name[0].toUpperCase() : '?',
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
                      label: tr('edit'),
                      onTap: () => _open(context, const EditProfileScreen()),
                    ),
                    const SizedBox(width: AuroraSpacing.sm),
                    _smallPill(
                      icon: Icons.settings_outlined,
                      label: tr('settings'),
                      onTap: () => _open(context, const SettingsScreen()),
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
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
                        valueColor: AlwaysStoppedAnimation(AuroraColors.ember),
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
    VoidCallback? onTap,
  }) {
    return AuroraCard(
      onTap: onTap,
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
    VoidCallback? onTap,
  }) {
    return AuroraCard(
      onTap: onTap,
      child: Row(
        children: [
          Expanded(child: Text(title, style: AuroraText.titleSmall)),
          Icon(icon, color: iconColor, size: 20),
          const SizedBox(width: AuroraSpacing.sm),
          Text(
            trailing,
            style: AuroraText.caption.copyWith(color: AuroraColors.ember),
          ),
          if (onTap != null)
            const Icon(Icons.chevron_left,
                color: AuroraColors.textSecondary, size: 18),
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
