import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// HancrCard — حاوية موحَّدة بـ 16px radius وحدّ خفيف
///
/// أنواع متاحة:
/// - `HancrCard.flat` — الافتراضي (حدّ خفيف، بدون ظل)
/// - `HancrCard.elevated` — مع ظل خفيف
/// - `HancrCard.selected` — حدّ violet للاختيار
/// - `HancrCard.dark` — navy خلفية (للأقسام المميَّزة)
class HancrCard extends StatelessWidget {
  const HancrCard({
    required this.child,
    this.padding = const EdgeInsets.all(HancrSpacing.lg),
    this.margin,
    this.onTap,
    this.variant = HancrCardVariant.flat,
    this.borderRadius,
    this.backgroundColor,
    super.key,
  });

  factory HancrCard.elevated({
    Key? key,
    required Widget child,
    EdgeInsets padding = const EdgeInsets.all(HancrSpacing.lg),
    EdgeInsets? margin,
    VoidCallback? onTap,
  }) => HancrCard(
        key: key,
        padding: padding,
        margin: margin,
        onTap: onTap,
        variant: HancrCardVariant.elevated,
        child: child,
      );

  factory HancrCard.selected({
    Key? key,
    required Widget child,
    EdgeInsets padding = const EdgeInsets.all(HancrSpacing.lg),
    EdgeInsets? margin,
    VoidCallback? onTap,
  }) => HancrCard(
        key: key,
        padding: padding,
        margin: margin,
        onTap: onTap,
        variant: HancrCardVariant.selected,
        child: child,
      );

  factory HancrCard.dark({
    Key? key,
    required Widget child,
    EdgeInsets padding = const EdgeInsets.all(HancrSpacing.lg),
    EdgeInsets? margin,
    VoidCallback? onTap,
  }) => HancrCard(
        key: key,
        padding: padding,
        margin: margin,
        onTap: onTap,
        variant: HancrCardVariant.dark,
        child: child,
      );

  final Widget child;
  final EdgeInsets padding;
  final EdgeInsets? margin;
  final VoidCallback? onTap;
  final HancrCardVariant variant;
  final BorderRadius? borderRadius;
  final Color? backgroundColor;

  ({Color bg, Color? border, double borderWidth, List<BoxShadow>? shadow})
      _decoration() {
    switch (variant) {
      case HancrCardVariant.flat:
        return (
          bg: backgroundColor ?? HancrColors.surface,
          border: HancrColors.divider,
          borderWidth: 1,
          shadow: null,
        );
      case HancrCardVariant.elevated:
        return (
          bg: backgroundColor ?? HancrColors.surface,
          border: null,
          borderWidth: 0,
          shadow: HancrShadows.card,
        );
      case HancrCardVariant.selected:
        return (
          bg: backgroundColor ?? HancrColors.surface,
          border: HancrColors.violet,
          borderWidth: 2,
          shadow: HancrShadows.violetGlow,
        );
      case HancrCardVariant.dark:
        return (
          bg: backgroundColor ?? HancrColors.navy,
          border: null,
          borderWidth: 0,
          shadow: null,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = _decoration();
    final radius = borderRadius ?? BorderRadius.circular(HancrRadius.lg);
    final content = Padding(padding: padding, child: child);

    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: d.bg,
        borderRadius: radius,
        border: d.border != null
            ? Border.all(color: d.border!, width: d.borderWidth)
            : null,
        boxShadow: d.shadow,
      ),
      clipBehavior: Clip.antiAlias,
      child: onTap != null
          ? Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: onTap,
                splashColor: variant == HancrCardVariant.dark
                    ? Colors.white.withValues(alpha: 0.05)
                    : HancrColors.violetLight.withValues(alpha: 0.3),
                highlightColor: variant == HancrCardVariant.dark
                    ? Colors.white.withValues(alpha: 0.03)
                    : HancrColors.violetLight.withValues(alpha: 0.15),
                child: content,
              ),
            )
          : content,
    );
  }
}

enum HancrCardVariant { flat, elevated, selected, dark }
