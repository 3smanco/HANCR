import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// HancrSearchBar — شريط البحث الرئيسي "إلى أين؟" مع pill "الآن ▾"
///
/// مستوحى من Uber 2024 home — كبير، واضح، tap للتنشيط
class HancrSearchBar extends StatelessWidget {
  const HancrSearchBar({
    required this.onTap,
    this.placeholder = 'إلى أين؟',
    this.timeLabel = 'الآن',
    this.onTimeTap,
    this.showTimePill = true,
    super.key,
  });

  final VoidCallback onTap;
  final String placeholder;
  final String timeLabel;
  final VoidCallback? onTimeTap;
  final bool showTimePill;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: HancrColors.surfaceMute,
      borderRadius: BorderRadius.circular(HancrRadius.pill),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(HancrRadius.pill),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: HancrSpacing.lg,
            vertical: HancrSpacing.md,
          ),
          child: Row(
            children: [
              const Icon(
                Icons.search_rounded,
                size: 22,
                color: HancrColors.textPrimary,
              ),
              const SizedBox(width: HancrSpacing.md),
              Expanded(
                child: Text(
                  placeholder,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: HancrColors.textPrimary,
                  ),
                ),
              ),
              if (showTimePill) ...[
                const SizedBox(width: HancrSpacing.sm),
                _TimePill(label: timeLabel, onTap: onTimeTap ?? onTap),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _TimePill extends StatelessWidget {
  const _TimePill({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(HancrRadius.pill),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(HancrRadius.pill),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: HancrSpacing.md,
            vertical: 6,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.access_time_rounded,
                size: 14,
                color: HancrColors.textPrimary,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: HancrColors.textPrimary,
                ),
              ),
              const Icon(
                Icons.keyboard_arrow_down_rounded,
                size: 16,
                color: HancrColors.textPrimary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// HancrPillFilter — pill filters قابلة للنقر مثل "Pick up now ▾"
class HancrPillFilter extends StatelessWidget {
  const HancrPillFilter({
    required this.label,
    required this.onTap,
    this.icon,
    this.selected = false,
    this.trailingIcon = Icons.keyboard_arrow_down_rounded,
    super.key,
  });

  final String label;
  final VoidCallback onTap;
  final IconData? icon;
  final IconData? trailingIcon;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final bg = selected ? HancrColors.violetLight : HancrColors.surfaceMute;
    final fg = selected ? HancrColors.violetDeep : HancrColors.textPrimary;

    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(HancrRadius.pill),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(HancrRadius.pill),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: HancrSpacing.md,
            vertical: HancrSpacing.sm,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 16, color: fg),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: fg,
                ),
              ),
              if (trailingIcon != null) ...[
                const SizedBox(width: 4),
                Icon(trailingIcon, size: 16, color: fg),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
