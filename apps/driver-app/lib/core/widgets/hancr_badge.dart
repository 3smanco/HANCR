import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// HancrBadge — chips صغيرة للحالات والشارات
enum HancrBadgeVariant {
  /// رمادي محايد
  neutral,

  /// أخضر للنجاح / online
  success,

  /// أصفر للتحذير / pending
  warning,

  /// أحمر للخطأ / banned
  danger,

  /// أزرق للمعلومات
  info,

  /// بنفسجي للـ promo / featured
  promo,

  /// navy للـ primary status
  primary,
}

class HancrBadge extends StatelessWidget {
  const HancrBadge({
    required this.label,
    this.variant = HancrBadgeVariant.neutral,
    this.icon,
    this.size = HancrBadgeSize.medium,
    super.key,
  });

  /// Helpers لجعل الاستخدام أوضح
  factory HancrBadge.success(String label, {IconData? icon}) =>
      HancrBadge(label: label, variant: HancrBadgeVariant.success, icon: icon);

  factory HancrBadge.warning(String label, {IconData? icon}) =>
      HancrBadge(label: label, variant: HancrBadgeVariant.warning, icon: icon);

  factory HancrBadge.danger(String label, {IconData? icon}) =>
      HancrBadge(label: label, variant: HancrBadgeVariant.danger, icon: icon);

  factory HancrBadge.promo(String label, {IconData? icon}) =>
      HancrBadge(label: label, variant: HancrBadgeVariant.promo, icon: icon);

  factory HancrBadge.info(String label, {IconData? icon}) =>
      HancrBadge(label: label, variant: HancrBadgeVariant.info, icon: icon);

  final String label;
  final HancrBadgeVariant variant;
  final IconData? icon;
  final HancrBadgeSize size;

  ({Color bg, Color fg}) _colors() {
    switch (variant) {
      case HancrBadgeVariant.neutral:
        return (bg: HancrColors.surfaceMute, fg: HancrColors.textSecondary);
      case HancrBadgeVariant.success:
        return (bg: HancrColors.successBg, fg: HancrColors.success);
      case HancrBadgeVariant.warning:
        return (bg: HancrColors.warningBg, fg: const Color(0xFF92400E));
      case HancrBadgeVariant.danger:
        return (bg: HancrColors.errorBg, fg: const Color(0xFFB91C1C));
      case HancrBadgeVariant.info:
        return (bg: HancrColors.infoBg, fg: const Color(0xFF1E40AF));
      case HancrBadgeVariant.promo:
        return (bg: HancrColors.violetLight, fg: HancrColors.violetDeep);
      case HancrBadgeVariant.primary:
        return (bg: HancrColors.navy, fg: Colors.white);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _colors();
    final padding = size == HancrBadgeSize.small
        ? const EdgeInsets.symmetric(horizontal: 8, vertical: 3)
        : const EdgeInsets.symmetric(
            horizontal: HancrSpacing.md,
            vertical: HancrSpacing.xs,
          );
    final fontSize = size == HancrBadgeSize.small ? 11.0 : 12.0;
    final iconSize = size == HancrBadgeSize.small ? 12.0 : 14.0;

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: c.bg,
        borderRadius: BorderRadius.circular(HancrRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: iconSize, color: c.fg),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w700,
              color: c.fg,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }
}

enum HancrBadgeSize { small, medium }

/// HancrTierBadge — شارة مستوى الولاء (Bronze→Diamond)
class HancrTierBadge extends StatelessWidget {
  const HancrTierBadge({required this.tier, super.key});

  final String tier;

  ({Color color, IconData icon, String label})? _tierInfo() {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return (
          color: HancrColors.tierBronze,
          icon: Icons.workspace_premium,
          label: 'Bronze',
        );
      case 'silver':
        return (
          color: HancrColors.tierSilver,
          icon: Icons.workspace_premium,
          label: 'Silver',
        );
      case 'gold':
        return (
          color: HancrColors.tierGold,
          icon: Icons.workspace_premium,
          label: 'Gold',
        );
      case 'platinum':
        return (
          color: HancrColors.tierPlatinum,
          icon: Icons.workspace_premium,
          label: 'Platinum',
        );
      case 'diamond':
        return (
          color: HancrColors.tierDiamond,
          icon: Icons.diamond,
          label: 'Diamond',
        );
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final info = _tierInfo();
    if (info == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: HancrSpacing.md,
        vertical: 6,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [info.color, info.color.withValues(alpha: 0.7)],
        ),
        borderRadius: BorderRadius.circular(HancrRadius.pill),
        boxShadow: [
          BoxShadow(
            color: info.color.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(info.icon, size: 14, color: Colors.white),
          const SizedBox(width: 6),
          Text(
            info.label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }
}
