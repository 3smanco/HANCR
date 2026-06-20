import 'package:flutter/material.dart';
import '../../theme/aurora_theme.dart';

/// AuroraListRow — صف قائمة عام بنمط Uber/Aurora:
/// أيقونة خطية + عنوان + وصف رمادي صغير (اختياري) + chevron،
/// مع دعم `danger` (أحمر) و`badge` (شارة NEW) و`trailing` مخصّص.
class AuroraListRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final bool danger;
  final String? badge;
  final Widget? trailing;

  const AuroraListRow({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
    this.danger = false,
    this.badge,
    this.trailing,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final accent = danger ? AuroraColors.danger : AuroraColors.ember;
    final titleColor = danger ? AuroraColors.danger : AuroraColors.pearl;
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(
          color: danger
              ? AuroraColors.danger.withValues(alpha: 0.4)
              : AuroraColors.border,
        ),
      ),
      child: ListTile(
        leading: Icon(icon, color: accent),
        title: Row(
          children: [
            Flexible(
              child: Text(title,
                  style:
                      AuroraText.bodyMedium.copyWith(color: titleColor)),
            ),
            if (badge != null) ...[
              const SizedBox(width: AuroraSpacing.sm),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0x333B82F6),
                  borderRadius: BorderRadius.circular(AuroraRadius.pill),
                  border: Border.all(color: const Color(0x803B82F6)),
                ),
                child: Text(badge!,
                    style: AuroraText.caption
                        .copyWith(color: const Color(0xFF60A5FA))),
              ),
            ],
          ],
        ),
        subtitle: subtitle == null
            ? null
            : Text(subtitle!, style: AuroraText.caption),
        trailing: trailing ??
            Icon(Icons.chevron_left,
                color: danger
                    ? AuroraColors.danger.withValues(alpha: 0.7)
                    : AuroraColors.textSecondary),
        onTap: onTap,
      ),
    );
  }
}
