import 'package:flutter/material.dart';
import '../../theme/aurora_theme.dart';

/// AuroraPromoCard — بطاقة large مع image background + label نص.
/// مستوحى من "Go on 2 wheels" / "Ride on your schedule" في الـ home.
class AuroraPromoCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData? icon;
  final Widget? leading;
  final VoidCallback? onTap;
  final List<Color>? gradientColors;
  final double height;

  const AuroraPromoCard({
    required this.title,
    this.subtitle,
    this.icon,
    this.leading,
    this.onTap,
    this.gradientColors,
    this.height = 180,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final gradient = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: gradientColors ??
          [
            AuroraColors.emberMute.withValues(alpha: 0.4),
            AuroraColors.coal,
          ],
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        child: Container(
          height: height,
          decoration: BoxDecoration(
            gradient: gradient,
            borderRadius: BorderRadius.circular(AuroraRadius.lg),
            border: Border.all(color: AuroraColors.border),
          ),
          padding: const EdgeInsets.all(AuroraSpacing.lg),
          child: Stack(
            children: [
              // Leading icon أو illustration في الأعلى
              if (leading != null)
                Positioned(top: 0, right: 0, child: leading!)
              else if (icon != null)
                Positioned(
                  top: 0,
                  right: 0,
                  child: Icon(icon, color: AuroraColors.ember, size: 48),
                ),
              // Bottom labels
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: AuroraText.titleSmall.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const Icon(
                          Icons.arrow_forward,
                          color: AuroraColors.ember,
                          size: 18,
                        ),
                      ],
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle!,
                        style: AuroraText.bodySmall,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
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
