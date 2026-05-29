import 'package:flutter/material.dart';
import '../../theme/aurora_theme.dart';

/// AuroraTabSwitcher — tabs مع orange glow underline.
/// مستوحى من Rides/Eats أو Rides/Delivery tabs في الـ home.
class AuroraTabSwitcher extends StatelessWidget {
  final List<AuroraTabItem> tabs;
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  const AuroraTabSwitcher({
    required this.tabs,
    required this.selectedIndex,
    required this.onChanged,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 56,
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.pill),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Stack(
        children: [
          // Selected indicator (نصف عرض الـ container)
          AnimatedAlign(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOutCubic,
            alignment: selectedIndex == 0
                ? Alignment.centerLeft
                : Alignment.centerRight,
            child: FractionallySizedBox(
              widthFactor: 1 / tabs.length,
              heightFactor: 1,
              child: Container(
                margin: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AuroraColors.emberMute.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(AuroraRadius.pill),
                  border: Border.all(color: AuroraColors.borderGlow),
                  boxShadow: AuroraShadows.iconGlow,
                ),
              ),
            ),
          ),
          Row(
            children: List.generate(tabs.length, (i) {
              final selected = selectedIndex == i;
              return Expanded(
                child: GestureDetector(
                  onTap: () => onChanged(i),
                  behavior: HitTestBehavior.opaque,
                  child: Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          tabs[i].icon,
                          size: 20,
                          color: selected
                              ? AuroraColors.ember
                              : AuroraColors.textSecondary,
                        ),
                        const SizedBox(width: AuroraSpacing.sm),
                        Text(
                          tabs[i].label,
                          style: AuroraText.titleSmall.copyWith(
                            color: selected
                                ? AuroraColors.pearl
                                : AuroraColors.textSecondary,
                            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class AuroraTabItem {
  final IconData icon;
  final String label;
  const AuroraTabItem({required this.icon, required this.label});
}
