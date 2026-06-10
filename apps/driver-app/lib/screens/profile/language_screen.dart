import 'package:flutter/material.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/theme/aurora_theme.dart';

/// شاشة اختيار اللغة للسائق — 8 لغات، تبديل فوري.
class DriverLanguageScreen extends StatefulWidget {
  const DriverLanguageScreen({super.key});
  @override
  State<DriverLanguageScreen> createState() => _DriverLanguageScreenState();
}

class _DriverLanguageScreenState extends State<DriverLanguageScreen> {
  @override
  Widget build(BuildContext context) {
    final current = LocaleController.instance.value.languageCode;
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        iconTheme: IconThemeData(color: AuroraColors.pearl),
        title: Text(tr('selectLanguage'),
            style: TextStyle(
                color: AuroraColors.pearl, fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: kSupportedLanguages.map((lang) {
          final selected = lang.code == current;
          return GestureDetector(
            onTap: () async {
              await LocaleController.instance.setLanguage(lang.code);
              if (context.mounted) setState(() {});
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: selected ? AuroraColors.smoke : AuroraColors.ash,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: selected ? AuroraColors.ember : AuroraColors.border,
                  width: selected ? 1.5 : 1,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AuroraColors.coal,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(lang.code.toUpperCase().substring(0, 2),
                        style: TextStyle(
                            color: AuroraColors.ember,
                            fontWeight: FontWeight.w700,
                            fontSize: 12)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(lang.nativeName,
                            style: TextStyle(
                                color: AuroraColors.pearl,
                                fontWeight: FontWeight.w700,
                                fontSize: 15)),
                        Text(lang.englishName,
                            style: const TextStyle(
                                color: AuroraColors.textSecondary,
                                fontSize: 12)),
                      ],
                    ),
                  ),
                  if (selected)
                    Icon(Icons.check_circle, color: AuroraColors.ember),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
