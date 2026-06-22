import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// HancrButton — أنواع أزرار HANCR الموحَّدة
///
/// أنواع متاحة:
/// - `HancrButton.primary` — violet ممتد للإجراء الأساسي
/// - `HancrButton.secondary` — navy (للإجراء الثانوي القوي)
/// - `HancrButton.outline` — حدّ فقط
/// - `HancrButton.ghost` — بدون خلفية (للإجراءات الخفيفة)
/// - `HancrButton.danger` — أحمر للإجراءات المدمِّرة
/// - `HancrButton.icon` — زر دائري بأيقونة فقط
enum HancrButtonVariant { primary, secondary, outline, ghost, danger }

enum HancrButtonSize { small, medium, large }

class HancrButton extends StatelessWidget {
  const HancrButton({
    required this.label,
    required this.onPressed,
    this.variant = HancrButtonVariant.primary,
    this.size = HancrButtonSize.large,
    this.icon,
    this.trailingIcon,
    this.loading = false,
    this.fullWidth = true,
    super.key,
  });

  /// Primary CTA — violet ممتد
  factory HancrButton.primary({
    Key? key,
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
    bool loading = false,
    bool fullWidth = true,
    HancrButtonSize size = HancrButtonSize.large,
  }) =>
      HancrButton(
        key: key,
        label: label,
        onPressed: onPressed,
        icon: icon,
        loading: loading,
        fullWidth: fullWidth,
        size: size,
      );

  factory HancrButton.secondary({
    Key? key,
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
    bool loading = false,
    bool fullWidth = true,
  }) =>
      HancrButton(
        key: key,
        label: label,
        onPressed: onPressed,
        variant: HancrButtonVariant.secondary,
        icon: icon,
        loading: loading,
        fullWidth: fullWidth,
      );

  factory HancrButton.outline({
    Key? key,
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
    bool fullWidth = true,
  }) =>
      HancrButton(
        key: key,
        label: label,
        onPressed: onPressed,
        variant: HancrButtonVariant.outline,
        icon: icon,
        fullWidth: fullWidth,
      );

  factory HancrButton.ghost({
    Key? key,
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
  }) =>
      HancrButton(
        key: key,
        label: label,
        onPressed: onPressed,
        variant: HancrButtonVariant.ghost,
        icon: icon,
        fullWidth: false,
      );

  factory HancrButton.danger({
    Key? key,
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
    bool fullWidth = true,
  }) =>
      HancrButton(
        key: key,
        label: label,
        onPressed: onPressed,
        variant: HancrButtonVariant.danger,
        icon: icon,
        fullWidth: fullWidth,
      );

  final String label;
  final VoidCallback? onPressed;
  final HancrButtonVariant variant;
  final HancrButtonSize size;
  final IconData? icon;
  final IconData? trailingIcon;
  final bool loading;
  final bool fullWidth;

  double get _height {
    switch (size) {
      case HancrButtonSize.small:
        return 40;
      case HancrButtonSize.medium:
        return 48;
      case HancrButtonSize.large:
        return 56;
    }
  }

  double get _fontSize {
    switch (size) {
      case HancrButtonSize.small:
        return 13;
      case HancrButtonSize.medium:
        return 15;
      case HancrButtonSize.large:
        return 16;
    }
  }

  ({Color bg, Color fg, Color? border}) _colors() {
    switch (variant) {
      case HancrButtonVariant.primary:
        return (bg: HancrColors.violet, fg: Colors.white, border: null);
      case HancrButtonVariant.secondary:
        return (bg: HancrColors.navy, fg: Colors.white, border: null);
      case HancrButtonVariant.outline:
        return (
          bg: Colors.transparent,
          fg: HancrColors.navy,
          border: HancrColors.borderStrong,
        );
      case HancrButtonVariant.ghost:
        return (bg: Colors.transparent, fg: HancrColors.violet, border: null);
      case HancrButtonVariant.danger:
        return (bg: HancrColors.error, fg: Colors.white, border: null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _colors();
    final isDisabled = onPressed == null || loading;
    final effectiveBg = isDisabled
        ? c.bg
            .withValues(alpha: variant == HancrButtonVariant.outline ? 1 : 0.4)
        : c.bg;
    final effectiveFg = isDisabled ? c.fg.withValues(alpha: 0.6) : c.fg;

    Widget child;
    if (loading) {
      child = SizedBox(
        height: 20,
        width: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2.2,
          valueColor: AlwaysStoppedAnimation(effectiveFg),
        ),
      );
    } else {
      child = Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: _fontSize + 4, color: effectiveFg),
            const SizedBox(width: HancrSpacing.sm),
          ],
          Flexible(
            child: Text(
              label,
              style: TextStyle(
                fontSize: _fontSize,
                fontWeight: FontWeight.w700,
                color: effectiveFg,
                letterSpacing: 0.2,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (trailingIcon != null) ...[
            const SizedBox(width: HancrSpacing.sm),
            Icon(trailingIcon, size: _fontSize + 4, color: effectiveFg),
          ],
        ],
      );
    }

    return SizedBox(
      width: fullWidth ? double.infinity : null,
      height: _height,
      child: Material(
        color: effectiveBg,
        borderRadius: BorderRadius.circular(HancrRadius.lg),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: isDisabled ? null : onPressed,
          borderRadius: BorderRadius.circular(HancrRadius.lg),
          splashColor: variant == HancrButtonVariant.primary
              ? HancrColors.violetDeep.withValues(alpha: 0.3)
              : null,
          child: Container(
            padding: EdgeInsets.symmetric(
              horizontal: fullWidth ? HancrSpacing.lg : HancrSpacing.xl,
            ),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(HancrRadius.lg),
              border: c.border != null
                  ? Border.all(color: c.border!, width: 1.5)
                  : null,
            ),
            alignment: Alignment.center,
            child: child,
          ),
        ),
      ),
    );
  }
}

/// HancrIconButton — زر دائري بأيقونة فقط
class HancrIconButton extends StatelessWidget {
  const HancrIconButton({
    required this.icon,
    required this.onPressed,
    this.size = 44,
    this.iconSize = 20,
    this.backgroundColor,
    this.foregroundColor,
    this.shadow = false,
    super.key,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final double size;
  final double iconSize;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final bool shadow;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: backgroundColor ?? Colors.white,
        shape: BoxShape.circle,
        boxShadow: shadow ? HancrShadows.card : null,
      ),
      child: Material(
        color: Colors.transparent,
        shape: const CircleBorder(),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onPressed,
          child: Icon(
            icon,
            size: iconSize,
            color: foregroundColor ?? HancrColors.textPrimary,
          ),
        ),
      ),
    );
  }
}
