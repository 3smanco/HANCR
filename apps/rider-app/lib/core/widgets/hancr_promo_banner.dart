import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// HancrPromoBanner — بانر إعلاني/تشجيعي بتدرُّج لوني
///
/// أمثلة:
/// - "أكمل الدفع: 25 ر.س" (warning)
/// - "اربح 200 ميل عند دعوة صديق" (violet)
/// - "تخفيض 40% على الـ next 3 طلبات" (navy)
enum HancrPromoVariant { violet, navy, warning, success, gold }

class HancrPromoBanner extends StatelessWidget {
  const HancrPromoBanner({
    required this.title,
    required this.onTap,
    this.subtitle,
    this.icon,
    this.actionLabel,
    this.variant = HancrPromoVariant.violet,
    this.height = 80,
    super.key,
  });

  final String title;
  final String? subtitle;
  final IconData? icon;
  final String? actionLabel;
  final VoidCallback onTap;
  final HancrPromoVariant variant;
  final double height;

  ({List<Color> gradient, Color fg, Color iconBg}) _palette() {
    switch (variant) {
      case HancrPromoVariant.violet:
        return (
          gradient: [HancrColors.violet, HancrColors.violetDeep],
          fg: Colors.white,
          iconBg: Colors.white.withValues(alpha: 0.2),
        );
      case HancrPromoVariant.navy:
        return (
          gradient: [HancrColors.navy, HancrColors.purple],
          fg: Colors.white,
          iconBg: HancrColors.violet.withValues(alpha: 0.3),
        );
      case HancrPromoVariant.warning:
        return (
          gradient: [const Color(0xFFFBBF24), const Color(0xFFF59E0B)],
          fg: const Color(0xFF78350F),
          iconBg: Colors.white.withValues(alpha: 0.4),
        );
      case HancrPromoVariant.success:
        return (
          gradient: [const Color(0xFF34D399), const Color(0xFF10B981)],
          fg: Colors.white,
          iconBg: Colors.white.withValues(alpha: 0.25),
        );
      case HancrPromoVariant.gold:
        return (
          gradient: [const Color(0xFFD4AF37), const Color(0xFFB8860B)],
          fg: Colors.white,
          iconBg: Colors.white.withValues(alpha: 0.25),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = _palette();
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(HancrRadius.lg),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Ink(
          height: height,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: p.gradient,
            ),
          ),
          child: Stack(
            children: [
              // Decorative circle (right side, mimics Uber bell promo)
              Positioned(
                right: -20,
                top: -20,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.08),
                  ),
                ),
              ),
              Positioned(
                right: -40,
                top: -40,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.1),
                  ),
                ),
              ),
              if (icon != null)
                Positioned(
                  right: HancrSpacing.lg,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: p.iconBg,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(icon, color: p.fg, size: 24),
                    ),
                  ),
                ),
              // Content
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: HancrSpacing.lg,
                  vertical: HancrSpacing.md,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: p.fg,
                        letterSpacing: 0.1,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle!,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: p.fg.withValues(alpha: 0.85),
                        ),
                      ),
                    ],
                    if (actionLabel != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            actionLabel!,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: p.fg,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(Icons.arrow_forward_rounded,
                              size: 16, color: p.fg),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
