import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// الشؤون القانونية — روابط الشروط/الخصوصية + تراخيص المصادر المفتوحة.
class LegalScreen extends StatelessWidget {
  const LegalScreen({super.key});

  Future<void> _open(String url) =>
      launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('legal'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: ListView(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            children: [
              AuroraListRow(
                icon: Icons.description_outlined,
                title: tr('legalTerms'),
                onTap: () => _open('https://hancr.com/ar/legal/terms'),
              ),
              AuroraListRow(
                icon: Icons.lock_outline,
                title: tr('privacyPolicy'),
                onTap: () => _open('https://hancr.com/ar/legal/privacy'),
              ),
              AuroraListRow(
                icon: Icons.gavel_outlined,
                title: tr('legalLicenses'),
                onTap: () => showLicensePage(
                  context: context,
                  applicationName: 'HANCR',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
