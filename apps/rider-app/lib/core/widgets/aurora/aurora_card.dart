import 'dart:ui';
import 'package:flutter/material.dart';
import '../../theme/aurora_theme.dart';

/// AuroraCard — حاوية متدرجة شبه شفافة مع glassmorphism.
///
/// Variants:
/// - default: ash background مع border خفيف
/// - glass: glassmorphism (blur + شفافية)
/// - selected: glow ring برتقالي حول البطاقة
/// - elevated: ظل عميق
class AuroraCard extends StatelessWidget {
  final Widget child;
  final AuroraCardVariant variant;
  final EdgeInsets? padding;
  final double radius;
  final VoidCallback? onTap;
  final bool selected;

  const AuroraCard({
    required this.child,
    this.variant = AuroraCardVariant.normal,
    this.padding,
    this.radius = AuroraRadius.lg,
    this.onTap,
    this.selected = false,
    super.key,
  });

  factory AuroraCard.glass({
    Key? key,
    required Widget child,
    EdgeInsets? padding,
    double radius = AuroraRadius.lg,
    VoidCallback? onTap,
  }) =>
      AuroraCard(
        key: key,
        child: child,
        variant: AuroraCardVariant.glass,
        padding: padding,
        radius: radius,
        onTap: onTap,
      );

  factory AuroraCard.selected({
    Key? key,
    required Widget child,
    EdgeInsets? padding,
    double radius = AuroraRadius.lg,
    VoidCallback? onTap,
  }) =>
      AuroraCard(
        key: key,
        child: child,
        variant: AuroraCardVariant.normal,
        padding: padding,
        radius: radius,
        onTap: onTap,
        selected: true,
      );

  @override
  Widget build(BuildContext context) {
    final effectiveRadius = BorderRadius.circular(radius);
    final card = AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: _backgroundColor,
        gradient: variant == AuroraCardVariant.glass
            ? AuroraColors.cardGlass
            : null,
        borderRadius: effectiveRadius,
        border: Border.all(
          color: selected ? AuroraColors.ember : _borderColor,
          width: selected ? 2 : 1,
        ),
        boxShadow: selected
            ? AuroraShadows.selectionGlow
            : variant == AuroraCardVariant.elevated
                ? AuroraShadows.cardDepth
                : null,
      ),
      child: ClipRRect(
        borderRadius: effectiveRadius,
        child: variant == AuroraCardVariant.glass
            ? BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                child: _content,
              )
            : _content,
      ),
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: effectiveRadius,
          child: card,
        ),
      );
    }
    return card;
  }

  Widget get _content => Padding(
        padding: padding ?? const EdgeInsets.all(AuroraSpacing.lg),
        child: child,
      );

  Color get _backgroundColor {
    switch (variant) {
      case AuroraCardVariant.glass:
        return Colors.white.withValues(alpha: 0.04);
      case AuroraCardVariant.elevated:
        return AuroraColors.smoke;
      case AuroraCardVariant.normal:
        return AuroraColors.ash;
    }
  }

  Color get _borderColor {
    switch (variant) {
      case AuroraCardVariant.glass:
        return AuroraColors.border;
      default:
        return AuroraColors.border;
    }
  }
}

enum AuroraCardVariant { normal, glass, elevated }
