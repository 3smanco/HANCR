import 'package:flutter/material.dart';
import '../../motion/haptics.dart';
import '../../theme/aurora_theme.dart';

/// AuroraButton — primary CTA مع orange glow.
///
/// Variants:
/// - primary: gradient ember + glow shadow
/// - secondary: ash background + border
/// - ghost: شفاف مع text فقط
/// - danger: red glow
class AuroraButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final IconData? trailingIcon;
  final AuroraButtonVariant variant;
  final AuroraButtonSize size;
  final bool fullWidth;
  final bool loading;

  const AuroraButton({
    required this.label,
    required this.onPressed,
    this.icon,
    this.trailingIcon,
    this.variant = AuroraButtonVariant.primary,
    this.size = AuroraButtonSize.large,
    this.fullWidth = true,
    this.loading = false,
    super.key,
  });

  factory AuroraButton.primary({
    Key? key,
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
    IconData? trailingIcon,
    bool fullWidth = true,
    bool loading = false,
    AuroraButtonSize size = AuroraButtonSize.large,
  }) =>
      AuroraButton(
        key: key,
        label: label,
        onPressed: onPressed,
        icon: icon,
        trailingIcon: trailingIcon,
        fullWidth: fullWidth,
        loading: loading,
        size: size,
      );

  factory AuroraButton.secondary({
    Key? key,
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
    bool fullWidth = true,
    bool loading = false,
    AuroraButtonSize size = AuroraButtonSize.large,
  }) =>
      AuroraButton(
        key: key,
        label: label,
        onPressed: onPressed,
        icon: icon,
        fullWidth: fullWidth,
        loading: loading,
        size: size,
        variant: AuroraButtonVariant.secondary,
      );

  factory AuroraButton.ghost({
    Key? key,
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
    bool fullWidth = false,
  }) =>
      AuroraButton(
        key: key,
        label: label,
        onPressed: onPressed,
        icon: icon,
        fullWidth: fullWidth,
        variant: AuroraButtonVariant.ghost,
        size: AuroraButtonSize.medium,
      );

  factory AuroraButton.danger({
    Key? key,
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
    bool fullWidth = true,
  }) =>
      AuroraButton(
        key: key,
        label: label,
        onPressed: onPressed,
        icon: icon,
        fullWidth: fullWidth,
        variant: AuroraButtonVariant.danger,
      );

  /// زر كبسولي صغير (pill) — للإجراءات الثانوية المدمجة.
  factory AuroraButton.pill({
    Key? key,
    required String label,
    required VoidCallback? onPressed,
    IconData? icon,
    bool primary = false,
  }) =>
      AuroraButton(
        key: key,
        label: label,
        onPressed: onPressed,
        icon: icon,
        fullWidth: false,
        size: AuroraButtonSize.small,
        variant: primary
            ? AuroraButtonVariant.primary
            : AuroraButtonVariant.secondary,
      );

  @override
  Widget build(BuildContext context) {
    final isDisabled = onPressed == null || loading;
    final isPrimary = variant == AuroraButtonVariant.primary;
    final isDanger = variant == AuroraButtonVariant.danger;
    final showGlow = (isPrimary || isDanger) && !isDisabled;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: fullWidth ? double.infinity : null,
      decoration: BoxDecoration(
        gradient: _gradient(isDisabled),
        color: _backgroundColor(isDisabled),
        borderRadius: BorderRadius.circular(_radius),
        border: variant == AuroraButtonVariant.secondary
            ? Border.all(color: AuroraColors.borderStrong)
            : null,
        boxShadow: showGlow
            ? (isDanger ? AuroraShadows.dangerGlow : AuroraShadows.emberGlow)
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isDisabled
              ? null
              : () {
                  // ردّ فعل لمسي موحّد عبر كل أزرار Aurora (N6 Haptics).
                  if (isDanger) {
                    Haptics.warning();
                  } else {
                    Haptics.selection();
                  }
                  onPressed!();
                },
          borderRadius: BorderRadius.circular(_radius),
          splashColor: Colors.white.withValues(alpha: 0.1),
          highlightColor: Colors.white.withValues(alpha: 0.05),
          child: Padding(
            padding: _padding,
            child: Row(
              mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (loading)
                  SizedBox(
                    height: _iconSize,
                    width: _iconSize,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation(AuroraColors.pearl),
                    ),
                  )
                else if (icon != null) ...[
                  Icon(icon, color: _textColor(isDisabled), size: _iconSize),
                  SizedBox(width: AuroraSpacing.sm),
                ],
                if (!loading)
                  Text(
                    label,
                    style: _textStyle.copyWith(color: _textColor(isDisabled)),
                  ),
                if (trailingIcon != null && !loading) ...[
                  SizedBox(width: AuroraSpacing.sm),
                  Icon(trailingIcon, color: _textColor(isDisabled), size: _iconSize),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  LinearGradient? _gradient(bool disabled) {
    if (disabled) return null;
    switch (variant) {
      case AuroraButtonVariant.primary:
        return AuroraColors.emberGradient;
      case AuroraButtonVariant.danger:
        return LinearGradient(
          colors: [AuroraColors.danger, Color(0xFFCC2424)],
        );
      default:
        return null;
    }
  }

  Color _backgroundColor(bool disabled) {
    if (disabled) return AuroraColors.smoke;
    switch (variant) {
      case AuroraButtonVariant.secondary:
        return AuroraColors.ash;
      case AuroraButtonVariant.ghost:
        return Colors.transparent;
      default:
        return Colors.transparent; // gradient handled by decoration
    }
  }

  Color _textColor(bool disabled) {
    if (disabled) return AuroraColors.textDisabled;
    switch (variant) {
      case AuroraButtonVariant.ghost:
        return AuroraColors.ember;
      default:
        return AuroraColors.pearl;
    }
  }

  double get _radius {
    switch (size) {
      case AuroraButtonSize.small:
        return AuroraRadius.sm;
      case AuroraButtonSize.medium:
        return AuroraRadius.md;
      case AuroraButtonSize.large:
        return AuroraRadius.lg;
    }
  }

  EdgeInsets get _padding {
    switch (size) {
      case AuroraButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: 14, vertical: 8);
      case AuroraButtonSize.medium:
        return const EdgeInsets.symmetric(horizontal: 20, vertical: 12);
      case AuroraButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: 24, vertical: 18);
    }
  }

  double get _iconSize {
    switch (size) {
      case AuroraButtonSize.small:
        return 16;
      case AuroraButtonSize.medium:
        return 18;
      case AuroraButtonSize.large:
        return 20;
    }
  }

  TextStyle get _textStyle {
    switch (size) {
      case AuroraButtonSize.small:
        return AuroraText.buttonMedium.copyWith(fontSize: 13);
      case AuroraButtonSize.medium:
        return AuroraText.buttonMedium;
      case AuroraButtonSize.large:
        return AuroraText.buttonLarge;
    }
  }
}

enum AuroraButtonVariant { primary, secondary, ghost, danger }

enum AuroraButtonSize { small, medium, large }

/// زر سفلي ثابت بعرض الشاشة (sticky CTA) — خلفية obsidian + حدّ علوي،
/// مع احترام الـ safe-area. يُوضع كآخر عنصر في Column/Stack.
class AuroraStickyButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;
  final bool danger;

  const AuroraStickyButton({
    required this.label,
    required this.onPressed,
    this.icon,
    this.loading = false,
    this.danger = false,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AuroraColors.obsidian,
      padding: EdgeInsets.fromLTRB(
        AuroraSpacing.lg,
        AuroraSpacing.md,
        AuroraSpacing.lg,
        AuroraSpacing.md + MediaQuery.of(context).viewPadding.bottom,
      ),
      child: danger
          ? AuroraButton.danger(label: label, onPressed: onPressed, icon: icon)
          : AuroraButton.primary(
              label: label,
              onPressed: onPressed,
              icon: icon,
              loading: loading,
            ),
    );
  }
}
