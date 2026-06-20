import 'package:flutter/material.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/theme/theme_controller.dart';
import '../../core/widgets/aurora/aurora.dart';

/// الوضع البسيط — تكبير الخطوط لكبار السن (textScaler على مستوى التطبيق).
class SimpleModeScreen extends StatefulWidget {
  const SimpleModeScreen({super.key});

  @override
  State<SimpleModeScreen> createState() => _SimpleModeScreenState();
}

class _SimpleModeScreenState extends State<SimpleModeScreen> {
  late bool _on = ThemeController.instance.simpleMode;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('simpleMode'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: ListView(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            children: [
              Center(
                child: Icon(Icons.elderly_outlined,
                    color: AuroraColors.ember, size: 56),
              ),
              const SizedBox(height: AuroraSpacing.lg),
              Text(tr('simpleModeInfo'),
                  style: AuroraText.bodyMedium.copyWith(height: 1.5)),
              const SizedBox(height: AuroraSpacing.lg),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AuroraSpacing.lg, vertical: 4),
                decoration: BoxDecoration(
                  color: AuroraColors.ash,
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  border: Border.all(color: AuroraColors.border),
                ),
                child: Row(
                  children: [
                    Icon(Icons.text_fields, color: AuroraColors.ember),
                    const SizedBox(width: AuroraSpacing.md),
                    Expanded(
                      child: Text(tr('simpleModeToggle'),
                          style: AuroraText.bodyMedium
                              .copyWith(color: AuroraColors.pearl)),
                    ),
                    Switch(
                      value: _on,
                      activeThumbColor: AuroraColors.ember,
                      onChanged: (v) {
                        setState(() => _on = v);
                        ThemeController.instance.setSimpleMode(v);
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
