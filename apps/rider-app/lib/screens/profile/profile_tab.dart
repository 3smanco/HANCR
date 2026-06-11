import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_event.dart';
import '../../blocs/rider/rider_state.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';
import '../wallet/wallet_screen.dart';
import '../sos/emergency_contacts_screen.dart';

/// ProfileTab — صفحة "حسابي" بالنمط الجديد
class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  bool _editing = false;
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();

  @override
  void dispose() {
    _firstCtrl.dispose();
    _lastCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  void _startEdit(RiderState state) {
    if (state is RiderLoaded) {
      _firstCtrl.text = state.rider.firstName ?? '';
      _lastCtrl.text = state.rider.lastName ?? '';
      _emailCtrl.text = state.rider.email ?? '';
      setState(() => _editing = true);
    }
  }

  void _save() {
    context.read<RiderBloc>().add(
          RiderUpdateRequested(
            firstName: _firstCtrl.text.trim().isEmpty
                ? null
                : _firstCtrl.text.trim(),
            lastName: _lastCtrl.text.trim().isEmpty
                ? null
                : _lastCtrl.text.trim(),
            email: _emailCtrl.text.trim().isEmpty
                ? null
                : _emailCtrl.text.trim(),
          ),
        );
    setState(() => _editing = false);
  }

  void _showComingSoon() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('قريباً')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HancrColors.background,
      appBar: AppBar(
        title: const Text('حسابي'),
        actions: [
          BlocBuilder<RiderBloc, RiderState>(
            builder: (ctx, state) {
              if (state is! RiderLoaded) return const SizedBox.shrink();
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: HancrSpacing.sm),
                child: _editing
                    ? HancrButton(
                        label: 'حفظ',
                        size: HancrButtonSize.small,
                        icon: Icons.check_rounded,
                        onPressed: _save,
                        fullWidth: false,
                      )
                    : TextButton.icon(
                        onPressed: () => _startEdit(state),
                        icon: const Icon(Icons.edit_outlined, size: 16),
                        label: const Text('تعديل'),
                      ),
              );
            },
          ),
        ],
      ),
      body: BlocBuilder<RiderBloc, RiderState>(
        builder: (ctx, state) {
          if (state is RiderLoading) {
            return const Center(
              child: CircularProgressIndicator(color: HancrColors.violet),
            );
          }
          if (state is RiderError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(HancrSpacing.xxl),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.error_outline_rounded,
                      size: 48,
                      color: HancrColors.error,
                    ),
                    const SizedBox(height: HancrSpacing.md),
                    Text(
                      state.message,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: HancrColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: HancrSpacing.lg),
                    HancrButton.primary(
                      label: 'إعادة المحاولة',
                      icon: Icons.refresh_rounded,
                      fullWidth: false,
                      onPressed: () => ctx
                          .read<RiderBloc>()
                          .add(const RiderLoadRequested()),
                    ),
                  ],
                ),
              ),
            );
          }
          if (state is RiderLoaded) {
            return _buildProfile(state);
          }
          return const Center(
            child: CircularProgressIndicator(color: HancrColors.violet),
          );
        },
      ),
    );
  }

  Widget _buildProfile(RiderLoaded state) {
    final rider = state.rider;
    return ListView(
      padding: const EdgeInsets.all(HancrSpacing.lg),
      children: [
        // ─── Hero card with avatar + name ───
        Container(
          padding: const EdgeInsets.all(HancrSpacing.xl),
          decoration: BoxDecoration(
            gradient: HancrColors.brandGradient,
            borderRadius: BorderRadius.circular(HancrRadius.xl),
            boxShadow: [
              BoxShadow(
                color: HancrColors.violet.withValues(alpha: 0.2),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            children: [
              Stack(
                children: [
                  Container(
                    width: 96,
                    height: 96,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: HancrColors.violetGradient,
                      border: Border.all(color: Colors.white, width: 4),
                      boxShadow: HancrShadows.violetGlow,
                    ),
                    child: Center(
                      child: Text(
                        rider.displayName.isNotEmpty
                            ? rider.displayName[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                  if (_editing)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.camera_alt_rounded,
                          size: 16,
                          color: HancrColors.violet,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: HancrSpacing.md),
              if (!_editing) ...[
                Text(
                  rider.displayName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: HancrSpacing.xs),
                Text(
                  rider.phoneNumber,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: HancrSpacing.lg),

        // ─── Quick Stats Row ───
        if (!_editing)
          HancrCard(
            child: Row(
              children: [
                Expanded(
                  child: _StatItem(
                    value: rider.totalRides.toString(),
                    label: 'الرحلات',
                    icon: Icons.directions_car_rounded,
                    color: HancrColors.violet,
                  ),
                ),
                Container(
                  width: 1,
                  height: 48,
                  color: HancrColors.divider,
                ),
                Expanded(
                  child: _StatItem(
                    value: rider.rating.toStringAsFixed(1),
                    label: 'التقييم',
                    icon: Icons.star_rounded,
                    color: const Color(0xFFFBBF24),
                  ),
                ),
                Container(
                  width: 1,
                  height: 48,
                  color: HancrColors.divider,
                ),
                Expanded(
                  child: _StatItem(
                    value: rider.balance.toStringAsFixed(0),
                    label: rider.currency,
                    icon: Icons.account_balance_wallet_rounded,
                    color: HancrColors.success,
                  ),
                ),
              ],
            ),
          ),
        const SizedBox(height: HancrSpacing.lg),

        // ─── Edit form ───
        if (_editing) ...[
          HancrCard(
            child: Column(
              children: [
                TextField(
                  controller: _firstCtrl,
                  decoration: const InputDecoration(
                    labelText: 'الاسم الأول',
                    prefixIcon: Icon(Icons.person_outline_rounded),
                  ),
                ),
                const SizedBox(height: HancrSpacing.md),
                TextField(
                  controller: _lastCtrl,
                  decoration: const InputDecoration(
                    labelText: 'اسم العائلة',
                    prefixIcon: Icon(Icons.person_outline_rounded),
                  ),
                ),
                const SizedBox(height: HancrSpacing.md),
                TextField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'البريد الإلكتروني',
                    prefixIcon: Icon(Icons.mail_outline_rounded),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: HancrSpacing.md),
          HancrButton.outline(
            label: 'إلغاء',
            onPressed: () => setState(() => _editing = false),
          ),
        ],

        // ─── Menu sections ───
        if (!_editing) ...[
          _SectionLabel(label: 'الحساب'),
          HancrCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _MenuRow(
                  icon: Icons.account_balance_wallet_rounded,
                  iconColor: HancrColors.violet,
                  label: 'محفظتي',
                  subtitle: '${rider.balance.toStringAsFixed(2)} ${rider.currency}',
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const WalletScreen(),
                      ),
                    );
                  },
                ),
                const _MenuDivider(),
                _MenuRow(
                  icon: Icons.credit_card_rounded,
                  iconColor: HancrColors.info,
                  label: 'طرق الدفع',
                  onTap: _showComingSoon,
                ),
                const _MenuDivider(),
                _MenuRow(
                  icon: Icons.bookmark_rounded,
                  iconColor: const Color(0xFFFBBF24),
                  label: 'العناوين المحفوظة',
                  onTap: _showComingSoon,
                ),
              ],
            ),
          ),
          const SizedBox(height: HancrSpacing.lg),

          _SectionLabel(label: 'التفضيلات'),
          HancrCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _MenuRow(
                  icon: Icons.notifications_outlined,
                  iconColor: HancrColors.violet,
                  label: 'الإشعارات',
                  onTap: _showComingSoon,
                ),
                const _MenuDivider(),
                _MenuRow(
                  icon: Icons.language_rounded,
                  iconColor: HancrColors.success,
                  label: 'اللغة',
                  subtitle: 'العربية',
                  onTap: _showComingSoon,
                ),
                const _MenuDivider(),
                _MenuRow(
                  icon: Icons.location_on_outlined,
                  iconColor: HancrColors.warning,
                  label: 'المنطقة',
                  subtitle: 'السعودية (SAR)',
                  onTap: _showComingSoon,
                ),
              ],
            ),
          ),
          const SizedBox(height: HancrSpacing.lg),

          _SectionLabel(label: 'الأمان والدعم'),
          HancrCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                _MenuRow(
                  icon: Icons.shield_outlined,
                  iconColor: HancrColors.success,
                  label: 'جهات الطوارئ',
                  subtitle: 'إدارة جهات الاتصال للطوارئ',
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const EmergencyContactsScreen(),
                      ),
                    );
                  },
                ),
                const _MenuDivider(),
                _MenuRow(
                  icon: Icons.help_outline_rounded,
                  iconColor: HancrColors.info,
                  label: 'المساعدة والدعم',
                  onTap: _showComingSoon,
                ),
                const _MenuDivider(),
                _MenuRow(
                  icon: Icons.privacy_tip_outlined,
                  iconColor: HancrColors.purple,
                  label: 'سياسة الخصوصية',
                  onTap: _showComingSoon,
                ),
                const _MenuDivider(),
                _MenuRow(
                  icon: Icons.gavel_rounded,
                  iconColor: HancrColors.purple,
                  label: 'الشروط والأحكام',
                  onTap: _showComingSoon,
                ),
              ],
            ),
          ),
          const SizedBox(height: HancrSpacing.lg),

          // Sign out
          HancrCard(
            padding: EdgeInsets.zero,
            child: _MenuRow(
              icon: Icons.logout_rounded,
              iconColor: HancrColors.error,
              labelColor: HancrColors.error,
              label: 'تسجيل الخروج',
              onTap: () => _confirmLogout(context),
              hideChevron: true,
            ),
          ),

          const SizedBox(height: HancrSpacing.xl),
          const Center(
            child: Text(
              'HANCR v1.0.0 · Zancr LLC',
              style: TextStyle(
                fontSize: 11,
                color: HancrColors.textHint,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],

        const SizedBox(height: HancrSpacing.huge),
      ],
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        icon: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: HancrColors.errorBg,
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.logout_rounded,
            color: HancrColors.error,
            size: 28,
          ),
        ),
        title: const Text('تسجيل الخروج؟'),
        content: const Text('ستحتاج إلى تسجيل الدخول مرة أخرى لاستخدام التطبيق.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx, false),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogCtx, true),
            style:
                FilledButton.styleFrom(backgroundColor: HancrColors.error),
            child: const Text('تسجيل الخروج'),
          ),
        ],
      ),
    ).then((confirmed) {
      if (confirmed == true && mounted) {
        context.read<AuthBloc>().add(const AuthLogoutRequested());
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widgets
// ─────────────────────────────────────────────────────────────────────────────

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.value,
    required this.label,
    required this.icon,
    required this.color,
  });

  final String value;
  final String label;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: HancrColors.textPrimary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: HancrColors.textSecondary,
          ),
        ),
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
        bottom: HancrSpacing.sm,
        right: HancrSpacing.xs,
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w800,
          color: HancrColors.textSecondary,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _MenuRow extends StatelessWidget {
  const _MenuRow({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.onTap,
    this.subtitle,
    this.labelColor,
    this.hideChevron = false,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final String? subtitle;
  final Color? labelColor;
  final VoidCallback onTap;
  final bool hideChevron;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: HancrSpacing.lg,
            vertical: HancrSpacing.md,
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(HancrRadius.sm),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(width: HancrSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: labelColor ?? HancrColors.textPrimary,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: HancrColors.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (!hideChevron)
                const Icon(
                  Icons.chevron_left_rounded,
                  color: HancrColors.textHint,
                  size: 22,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MenuDivider extends StatelessWidget {
  const _MenuDivider();

  @override
  Widget build(BuildContext context) {
    return const Divider(
      height: 1,
      color: HancrColors.divider,
      indent: HancrSpacing.lg,
      endIndent: HancrSpacing.lg,
    );
  }
}
