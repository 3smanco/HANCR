import 'package:flutter/material.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// عناصر إضافية للشاشة الرئيسية: مركز الإشعارات + العروض.

// ════════════════════════════════════════════════════════════════
// مركز الإشعارات
// ════════════════════════════════════════════════════════════════
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final items = <(IconData, String, String, String)>[
      (Icons.local_offer, tr('notifOfferTitle'), tr('notifOfferBody'), tr('hourAgo')),
      (Icons.verified, tr('notifWelcomeTitle'), tr('notifWelcomeBody'), tr('yesterday')),
      (Icons.bolt, tr('notifSurgeTitle'), tr('notifSurgeBody'), tr('yesterday')),
    ];
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('notifications'), style: AuroraText.titleMedium),
        iconTheme: const IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: ListView.builder(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final n = items[i];
              return Container(
                margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
                padding: const EdgeInsets.all(AuroraSpacing.md),
                decoration: BoxDecoration(
                  color: AuroraColors.ash,
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  border: Border.all(color: AuroraColors.border),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AuroraColors.coal,
                        borderRadius: BorderRadius.circular(AuroraRadius.sm),
                        boxShadow: AuroraShadows.iconGlow,
                      ),
                      child: Icon(n.$1, color: AuroraColors.ember, size: 20),
                    ),
                    const SizedBox(width: AuroraSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Flexible(
                                  child: Text(n.$2,
                                      style: AuroraText.titleSmall)),
                              Text(n.$4, style: AuroraText.caption),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(n.$3, style: AuroraText.bodySmall),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════
// العروض والترويجات
// ════════════════════════════════════════════════════════════════
class OffersScreen extends StatelessWidget {
  const OffersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final offers = <(String, String, String, Color)>[
      ('WELCOME', tr('offerWelcomeTitle'), tr('offerWelcomeSub'), AuroraColors.ember),
      ('WEEKEND', tr('offerWeekendTitle'), tr('offerWeekendSub'), AuroraColors.info),
      ('NIGHT', tr('offerNightTitle'), tr('offerNightSub'), AuroraColors.gold),
    ];
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('offersTitle'), style: AuroraText.titleMedium),
        iconTheme: const IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: ListView.builder(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            itemCount: offers.length,
            itemBuilder: (_, i) {
              final o = offers[i];
              final color = o.$4;
              return Container(
                margin: const EdgeInsets.only(bottom: AuroraSpacing.md),
                padding: const EdgeInsets.all(AuroraSpacing.lg),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [color.withValues(alpha: 0.25), AuroraColors.coal],
                  ),
                  borderRadius: BorderRadius.circular(AuroraRadius.lg),
                  border: Border.all(color: color.withValues(alpha: 0.5)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(o.$2, style: AuroraText.titleSmall),
                          const SizedBox(height: 4),
                          Text(o.$3, style: AuroraText.bodySmall),
                          const SizedBox(height: AuroraSpacing.sm),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AuroraColors.obsidian.withValues(alpha: 0.5),
                              borderRadius:
                                  BorderRadius.circular(AuroraRadius.sm),
                              border: Border.all(color: color),
                            ),
                            child: Text('${tr('codePrefix')} ${o.$1}',
                                style: AuroraText.caption
                                    .copyWith(color: color)),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.local_offer, color: color, size: 40),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
