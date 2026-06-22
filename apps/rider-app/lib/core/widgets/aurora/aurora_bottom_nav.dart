import 'package:flutter/material.dart';
import '../../theme/aurora_theme.dart';

/// AuroraBottomNav — bottom nav مع orange glow على الـ tab المحدد + center FAB.
///
/// مستوحى من الصور: Home / Services / [Center+] / Activity / Account
class AuroraBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final VoidCallback? onCenterPressed;
  final List<AuroraNavItem> items;

  /// ارتفاع الشريط الثابت (بدون الـ safe-area السفلي). تستخدمه الشاشات
  /// القابلة للتمرير لحساب الحشوة السفلية حتى لا يختفي آخر عنصر خلف الشريط.
  static const double height = 72;

  const AuroraBottomNav({
    required this.currentIndex,
    required this.onTap,
    required this.items,
    this.onCenterPressed,
    super.key,
  }) : assert(items.length == 4, 'AuroraBottomNav يتطلب 4 items بالضبط');

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        border: Border(
          top: BorderSide(color: AuroraColors.border, width: 0.5),
        ),
        boxShadow: AuroraShadows.floatingNav,
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: height,
          child: Row(
            children: [
              _navItem(0, items[0]),
              _navItem(1, items[1]),
              _centerButton(),
              _navItem(2, items[2]),
              _navItem(3, items[3]),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(int idx, AuroraNavItem item) {
    final selected = currentIndex == idx;
    return Expanded(
      child: InkWell(
        onTap: () => onTap(idx),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: EdgeInsets.all(selected ? 10 : 8),
              decoration: BoxDecoration(
                color: selected
                    ? AuroraColors.emberMute.withValues(alpha: 0.4)
                    : Colors.transparent,
                shape: BoxShape.circle,
                boxShadow: selected ? AuroraShadows.iconGlow : null,
              ),
              child: Icon(
                selected ? item.activeIcon : item.icon,
                color:
                    selected ? AuroraColors.ember : AuroraColors.textSecondary,
                size: 22,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              item.label,
              style: AuroraText.caption.copyWith(
                color:
                    selected ? AuroraColors.ember : AuroraColors.textSecondary,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Center FAB — sparkles button (الـ AI assistant مثلاً)
  Widget _centerButton() {
    return SizedBox(
      width: 80,
      child: Center(
        child: GestureDetector(
          onTap: onCenterPressed,
          child: Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              gradient: AuroraColors.emberGradient,
              shape: BoxShape.circle,
              boxShadow: AuroraShadows.emberGlow,
            ),
            child: Icon(
              Icons.auto_awesome,
              color: AuroraColors.pearl,
              size: 26,
            ),
          ),
        ),
      ),
    );
  }
}

class AuroraNavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const AuroraNavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}
