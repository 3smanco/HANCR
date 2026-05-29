import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// HancrLocationInput — حقلا "من" / "إلى" مع timeline indicator على اليسار
///
/// مستوحى من Uber Plan Your Ride pattern.
/// خط رأسي بين الحقلين مع dot (origin) و square (destination).
class HancrLocationInput extends StatelessWidget {
  const HancrLocationInput({
    required this.originText,
    required this.destinationText,
    required this.onOriginTap,
    required this.onDestinationTap,
    this.originPlaceholder = 'موقع الالتقاء',
    this.destinationPlaceholder = 'إلى أين؟',
    super.key,
  });

  final String? originText;
  final String? destinationText;
  final VoidCallback onOriginTap;
  final VoidCallback onDestinationTap;
  final String originPlaceholder;
  final String destinationPlaceholder;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(width: HancrSpacing.sm),
        // Timeline indicator
        SizedBox(
          width: 24,
          child: Column(
            children: [
              const SizedBox(height: 22),
              // Origin: filled circle
              Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: HancrColors.navy,
                  shape: BoxShape.circle,
                ),
              ),
              // Dotted line
              Container(
                width: 2,
                height: 40,
                margin: const EdgeInsets.symmetric(vertical: 4),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(1),
                  color: HancrColors.borderStrong,
                ),
              ),
              // Destination: filled square
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: HancrColors.violet,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: HancrSpacing.md),
        // Two stacked tappable rows
        Expanded(
          child: Column(
            children: [
              _LocationRow(
                text: originText,
                placeholder: originPlaceholder,
                onTap: onOriginTap,
              ),
              const Divider(height: 1, color: HancrColors.divider),
              _LocationRow(
                text: destinationText,
                placeholder: destinationPlaceholder,
                onTap: onDestinationTap,
                emphasis: true,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _LocationRow extends StatelessWidget {
  const _LocationRow({
    required this.text,
    required this.placeholder,
    required this.onTap,
    this.emphasis = false,
  });

  final String? text;
  final String placeholder;
  final VoidCallback onTap;
  final bool emphasis;

  @override
  Widget build(BuildContext context) {
    final isEmpty = text == null || text!.isEmpty;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: HancrSpacing.lg,
            vertical: HancrSpacing.lg,
          ),
          decoration: BoxDecoration(
            color: HancrColors.surfaceMute,
            borderRadius: BorderRadius.circular(HancrRadius.sm),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  isEmpty ? placeholder : text!,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: emphasis ? FontWeight.w700 : FontWeight.w500,
                    color: isEmpty
                        ? HancrColors.textHint
                        : HancrColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (!isEmpty)
                const Icon(
                  Icons.close_rounded,
                  size: 18,
                  color: HancrColors.textHint,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// HancrSavedPlaceRow — صف "Saved places" أو موقع محفوظ (مثل المنزل/العمل)
class HancrSavedPlaceRow extends StatelessWidget {
  const HancrSavedPlaceRow({
    required this.label,
    required this.onTap,
    this.subtitle,
    this.icon = Icons.bookmark_rounded,
    this.iconColor,
    this.iconBackground,
    super.key,
  });

  final String label;
  final String? subtitle;
  final VoidCallback onTap;
  final IconData icon;
  final Color? iconColor;
  final Color? iconBackground;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: HancrSpacing.lg,
            vertical: HancrSpacing.md,
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconBackground ?? HancrColors.surfaceMute,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  size: 20,
                  color: iconColor ?? HancrColors.textPrimary,
                ),
              ),
              const SizedBox(width: HancrSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: HancrColors.textPrimary,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        subtitle!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: HancrColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                size: 22,
                color: HancrColors.textHint,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
