import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// اربح بالقيادة — ترويج تطبيق السائق + رابط التحميل.
class EarnDrivingScreen extends StatelessWidget {
  const EarnDrivingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final benefits = <(IconData, String, String)>[
      (Icons.payments_outlined, tr('earnB1'), tr('earnB1Sub')),
      (Icons.schedule_outlined, tr('earnB2'), tr('earnB2Sub')),
      (Icons.trending_up, tr('earnB3'), tr('earnB3Sub')),
    ];
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(AuroraSpacing.lg),
                  children: [
                    Container(
                      width: 84,
                      height: 84,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        gradient: AuroraColors.emberGradient,
                        shape: BoxShape.circle,
                        boxShadow: AuroraShadows.iconGlow,
                      ),
                      child: Icon(Icons.directions_car,
                          color: AuroraColors.pearl, size: 40),
                    ),
                    const SizedBox(height: AuroraSpacing.lg),
                    Text(tr('earnTitle'),
                        textAlign: TextAlign.center,
                        style: AuroraText.displayMedium),
                    const SizedBox(height: AuroraSpacing.sm),
                    Text(tr('earnSub'),
                        textAlign: TextAlign.center,
                        style: AuroraText.bodyMedium),
                    const SizedBox(height: AuroraSpacing.xl),
                    ...benefits.map((b) => Padding(
                          padding:
                              const EdgeInsets.only(bottom: AuroraSpacing.md),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: AuroraColors.smoke,
                                  borderRadius:
                                      BorderRadius.circular(AuroraRadius.md),
                                ),
                                child: Icon(b.$1,
                                    color: AuroraColors.ember, size: 22),
                              ),
                              const SizedBox(width: AuroraSpacing.md),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(b.$2, style: AuroraText.titleSmall),
                                    const SizedBox(height: 2),
                                    Text(b.$3, style: AuroraText.bodySmall),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        )),
                  ],
                ),
              ),
              AuroraStickyButton(
                label: tr('downloadDriverApp'),
                icon: Icons.download_outlined,
                onPressed: () => launchUrl(
                  Uri.parse('https://hancr.com/downloads/hancr-driver.apk'),
                  mode: LaunchMode.externalApplication,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
