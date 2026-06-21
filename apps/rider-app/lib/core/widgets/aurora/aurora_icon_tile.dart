import 'package:flutter/material.dart';
import '../../theme/aurora_theme.dart';

/// AuroraIconTile — أيقونة كبيرة مع label تحتها + glow اختياري.
///
/// مستوحى من الصور: أيقونات outlined orange مع label أبيض.
/// مع badge اختياري ("Promo") في الأعلى.
class AuroraIconTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool selected;
  final String? badge;
  final Color? badgeColor;
  final double size;

  const AuroraIconTile({
    required this.icon,
    required this.label,
    this.onTap,
    this.selected = false,
    this.badge,
    this.badgeColor,
    this.size = 96,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(AuroraRadius.lg),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: size,
              height: size,
              decoration: BoxDecoration(
                color: selected
                    ? AuroraColors.emberMute.withValues(alpha: 0.3)
                    : AuroraColors.ash,
                borderRadius: BorderRadius.circular(AuroraRadius.lg),
                border: Border.all(
                  color: selected
                      ? AuroraColors.ember
                      : AuroraColors.border,
                  width: selected ? 1.5 : 1,
                ),
                boxShadow: selected ? AuroraShadows.iconGlow : null,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Icon مع glow halo
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: AuroraShadows.iconGlow,
                    ),
                    child: Icon(
                      icon,
                      size: 32,
                      color: AuroraColors.ember,
                    ),
                  ),
                  const SizedBox(height: AuroraSpacing.sm),
                  Text(
                    label,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AuroraText.bodySmall.copyWith(
                      color: AuroraColors.pearl,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        // Promo badge
        if (badge != null)
          Positioned(
            top: -8,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AuroraSpacing.sm, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeColor ?? AuroraColors.promoBg,
                  borderRadius: BorderRadius.circular(AuroraRadius.pill),
                ),
                child: Text(
                  badge!,
                  style: AuroraText.caption.copyWith(
                    color: AuroraColors.promoText,
                    fontWeight: FontWeight.w700,
                    fontSize: 10,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
