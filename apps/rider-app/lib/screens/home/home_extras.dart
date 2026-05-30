import 'package:flutter/material.dart';
import '../../core/widgets/aurora/aurora.dart';

/// عناصر إضافية للشاشة الرئيسية: مركز الإشعارات + العروض.

// ════════════════════════════════════════════════════════════════
// مركز الإشعارات
// ════════════════════════════════════════════════════════════════
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  static const _items = [
    (Icons.local_offer, 'عرض خاص!', 'خصم 25٪ على رحلتك القادمة باستخدام كود WELCOME', 'منذ ساعة'),
    (Icons.verified, 'مرحباً بك في HANCR', 'أكمل ملفك الشخصي واحصل على رحلة مجانية', 'أمس'),
    (Icons.bolt, 'وضع الذروة', 'الأسعار مرتفعة قليلاً في منطقتك الآن', 'أمس'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text('الإشعارات', style: AuroraText.titleMedium),
        iconTheme: const IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: ListView.builder(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            itemCount: _items.length,
            itemBuilder: (_, i) {
              final n = _items[i];
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

  static const _offers = [
    ('WELCOME', 'خصم 25٪ لأول رحلة', 'صالح حتى نهاية الشهر', AuroraColors.ember),
    ('WEEKEND', 'وفّر 15٪ في عطلة نهاية الأسبوع', 'الجمعة والسبت', AuroraColors.info),
    ('NIGHT', 'رحلات ليلية بسعر مخفّض', 'من 12 ص حتى 6 ص', AuroraColors.gold),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text('العروض', style: AuroraText.titleMedium),
        iconTheme: const IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: ListView.builder(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            itemCount: _offers.length,
            itemBuilder: (_, i) {
              final o = _offers[i];
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
                            child: Text('كود: ${o.$1}',
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
