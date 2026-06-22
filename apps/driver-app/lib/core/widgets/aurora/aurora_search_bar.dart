import 'package:flutter/material.dart';
import '../../theme/aurora_theme.dart';

/// AuroraSearchBar — حقل بحث مع زر مجاور.
/// مستوحى من "Where to?" مع pill على اليمين.
class AuroraSearchBar extends StatelessWidget {
  final String hint;
  final VoidCallback? onTap;
  final Widget? trailing;

  const AuroraSearchBar({
    required this.hint,
    this.onTap,
    this.trailing,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AuroraRadius.pill),
        child: Container(
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
          decoration: BoxDecoration(
            color: AuroraColors.ash,
            borderRadius: BorderRadius.circular(AuroraRadius.pill),
            border: Border.all(color: AuroraColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AuroraColors.smoke,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.search,
                  color: AuroraColors.textSecondary,
                  size: 18,
                ),
              ),
              const SizedBox(width: AuroraSpacing.md),
              Expanded(
                child: Text(
                  hint,
                  style: AuroraText.bodyLarge.copyWith(
                    color: AuroraColors.textHint,
                  ),
                ),
              ),
              ?trailing,
            ],
          ),
        ),
      ),
    );
  }
}
