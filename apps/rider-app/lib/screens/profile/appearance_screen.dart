import 'package:flutter/material.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/theme/theme_controller.dart';
import '../../core/widgets/aurora/aurora.dart';

/// إعدادات المظهر — راديو (حسب النظام / فاتح / داكن).
/// الهوية الداكنة محفوظة: التفضيل يُحفظ ويُطبَّق عبر ThemeMode، لكن العرض
/// يبقى داكناً حتى يُصمَّم وضع فاتح كامل (تنويه "قريباً" عند اختيار فاتح).
class AppearanceScreen extends StatefulWidget {
  const AppearanceScreen({super.key});

  @override
  State<AppearanceScreen> createState() => _AppearanceScreenState();
}

class _AppearanceScreenState extends State<AppearanceScreen> {
  late String _mode = ThemeController.instance.appearanceMode;

  Future<void> _select(String mode) async {
    setState(() => _mode = mode);
    await ThemeController.instance.setAppearanceMode(mode);
  }

  @override
  Widget build(BuildContext context) {
    final options = <(String, String, String, IconData)>[
      (
        'system',
        tr('appearanceSystem'),
        tr('appearanceSystemSub'),
        Icons.brightness_auto_outlined
      ),
      (
        'light',
        tr('appearanceLight'),
        tr('appearanceLightSub'),
        Icons.light_mode_outlined
      ),
      (
        'dark',
        tr('appearanceDark'),
        tr('appearanceDarkSub'),
        Icons.dark_mode_outlined
      ),
      (
        'vip',
        tr('appearanceVip'),
        tr('appearanceVipSub'),
        Icons.workspace_premium_outlined
      ),
    ];
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('appearance'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: ListView(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            children: [
              ...options.map((o) => _radio(o.$1, o.$2, o.$3, o.$4)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _radio(String value, String title, String sub, IconData icon) {
    final sel = _mode == value;
    return GestureDetector(
      onTap: () => _select(value),
      child: Container(
        margin: const EdgeInsets.only(bottom: AuroraSpacing.md),
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        decoration: BoxDecoration(
          color: sel ? AuroraColors.smoke : AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          border: Border.all(
            color: sel ? AuroraColors.ember : AuroraColors.border,
            width: sel ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: AuroraColors.ember, size: 22),
            const SizedBox(width: AuroraSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AuroraText.titleSmall),
                  const SizedBox(height: 2),
                  Text(sub, style: AuroraText.bodySmall),
                ],
              ),
            ),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: sel ? AuroraColors.ember : AuroraColors.textSecondary,
                  width: 2,
                ),
              ),
              child: sel
                  ? Center(
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: AuroraColors.ember,
                          shape: BoxShape.circle,
                        ),
                      ),
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
