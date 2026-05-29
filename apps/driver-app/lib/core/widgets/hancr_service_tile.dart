import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'hancr_badge.dart';

/// HancrServiceTile — بطاقة خدمة مع أيقونة + اسم + promo badge اختياري
///
/// مستوحى من Uber Home suggestions section.
/// مربَّعة 1:1 مع violet glow عند الـ tap.
class HancrServiceTile extends StatelessWidget {
  const HancrServiceTile({
    required this.label,
    required this.icon,
    required this.onTap,
    this.iconColor,
    this.backgroundColor,
    this.imageUrl,
    this.badge,
    this.enabled = true,
    super.key,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? backgroundColor;
  final String? imageUrl;
  final String? badge;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1.0 : 0.4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: Stack(
              children: [
                Material(
                  color: backgroundColor ?? HancrColors.surfaceMute,
                  borderRadius: BorderRadius.circular(HancrRadius.lg),
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: enabled ? onTap : null,
                    splashColor: HancrColors.violetLight.withValues(alpha: 0.4),
                    child: Center(
                      child: imageUrl != null
                          ? Image.network(
                              imageUrl!,
                              width: 56,
                              height: 56,
                              fit: BoxFit.contain,
                              errorBuilder: (_, __, ___) => Icon(
                                icon,
                                size: 36,
                                color: iconColor ?? HancrColors.navy,
                              ),
                            )
                          : Icon(
                              icon,
                              size: 36,
                              color: iconColor ?? HancrColors.navy,
                            ),
                    ),
                  ),
                ),
                if (badge != null)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: HancrBadge.promo(badge!),
                  ),
              ],
            ),
          ),
          const SizedBox(height: HancrSpacing.sm),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: HancrColors.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

/// HancrTripOption — خيار رحلة في "Choose a trip" (مثل Uber Go)
///
/// state: غير مختار (border رمادي) ، مختار (border violet عريض)
class HancrTripOption extends StatelessWidget {
  const HancrTripOption({
    required this.tierName,
    required this.priceLabel,
    required this.eta,
    required this.icon,
    required this.selected,
    required this.onTap,
    this.subtitle,
    this.discountedPrice,
    this.badge,
    super.key,
  });

  final String tierName;
  final String priceLabel;
  final String eta;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  final String? subtitle;
  final String? discountedPrice;
  final String? badge; // مثلاً "أسرع"

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOutCubic,
      decoration: BoxDecoration(
        color: HancrColors.surface,
        borderRadius: BorderRadius.circular(HancrRadius.lg),
        border: Border.all(
          color: selected ? HancrColors.violet : HancrColors.divider,
          width: selected ? 2 : 1,
        ),
        boxShadow: selected ? HancrShadows.violetGlow : null,
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(HancrRadius.lg),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(HancrSpacing.lg),
            child: Row(
              children: [
                // Icon
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: selected
                        ? HancrColors.violetLight
                        : HancrColors.surfaceMute,
                    borderRadius: BorderRadius.circular(HancrRadius.md),
                  ),
                  child: Icon(
                    icon,
                    size: 32,
                    color: selected ? HancrColors.violetDeep : HancrColors.navy,
                  ),
                ),
                const SizedBox(width: HancrSpacing.md),
                // Title + ETA
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            tierName,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: HancrColors.textPrimary,
                            ),
                          ),
                          if (badge != null) ...[
                            const SizedBox(width: HancrSpacing.sm),
                            HancrBadge.info(badge!, icon: Icons.bolt_rounded),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        eta,
                        style: const TextStyle(
                          fontSize: 13,
                          color: HancrColors.textSecondary,
                        ),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle!,
                          style: const TextStyle(
                            fontSize: 12,
                            color: HancrColors.textHint,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                // Price
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      priceLabel,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: HancrColors.textPrimary,
                      ),
                    ),
                    if (discountedPrice != null)
                      Text(
                        discountedPrice!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: HancrColors.textHint,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
