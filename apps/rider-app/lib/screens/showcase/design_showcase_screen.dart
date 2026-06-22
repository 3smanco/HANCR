import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/aurora_theme.dart';
import '../../core/widgets/car_art.dart';
import '../../core/widgets/hancr_widgets.dart';

/// DesignShowcaseScreen — عرض حيّ لكل مكونات HANCR Design System
///
/// أضِفها لـ router مؤقَّتاً للتحقق البصري:
/// ```dart
/// GoRoute(path: '/showcase', builder: (_, __) => const DesignShowcaseScreen())
/// ```
class DesignShowcaseScreen extends StatefulWidget {
  const DesignShowcaseScreen({super.key});

  @override
  State<DesignShowcaseScreen> createState() => _DesignShowcaseScreenState();
}

class _DesignShowcaseScreenState extends State<DesignShowcaseScreen> {
  int _selectedTrip = 1;

  void _snack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('HANCR Design System'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => Navigator.maybePop(context),
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(HancrSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ============ Color Palette ============
              _section('🎨 الألوان'),
              _ColorPalette(),
              const SizedBox(height: HancrSpacing.xxl),

              // ============ Buttons ============
              _section('🔘 الأزرار'),
              HancrButton.primary(
                label: 'تأكيد الطلب',
                onPressed: () => _snack('Primary clicked'),
                icon: Icons.check_rounded,
              ),
              const SizedBox(height: HancrSpacing.md),
              HancrButton.secondary(
                label: 'متابعة',
                onPressed: () => _snack('Secondary clicked'),
              ),
              const SizedBox(height: HancrSpacing.md),
              HancrButton.outline(
                label: 'إلغاء',
                onPressed: () => _snack('Outline clicked'),
              ),
              const SizedBox(height: HancrSpacing.md),
              HancrButton.danger(
                label: 'احذف الحساب',
                onPressed: () => _snack('Danger clicked'),
                icon: Icons.delete_outline_rounded,
              ),
              const SizedBox(height: HancrSpacing.md),
              Row(
                children: [
                  HancrButton.ghost(
                    label: 'تجاوز',
                    onPressed: () => _snack('Ghost'),
                  ),
                  const Spacer(),
                  HancrIconButton(
                    icon: Icons.favorite_outline_rounded,
                    onPressed: () => _snack('Heart!'),
                    shadow: true,
                  ),
                  const SizedBox(width: HancrSpacing.sm),
                  HancrIconButton(
                    icon: Icons.notifications_outlined,
                    onPressed: () => _snack('Bell'),
                    backgroundColor: HancrColors.violet,
                    foregroundColor: Colors.white,
                  ),
                ],
              ),
              const SizedBox(height: HancrSpacing.md),
              HancrButton.primary(
                label: 'جاري التحميل...',
                onPressed: null,
                loading: true,
              ),
              const SizedBox(height: HancrSpacing.xxl),

              // ============ Badges ============
              _section('🏷️ الشارات'),
              Wrap(
                spacing: HancrSpacing.sm,
                runSpacing: HancrSpacing.sm,
                children: [
                  HancrBadge.success('متصل', icon: Icons.circle),
                  HancrBadge.warning('قيد المراجعة'),
                  HancrBadge.danger('محظور'),
                  HancrBadge.info('جديد'),
                  HancrBadge.promo('خصم 40%'),
                  const HancrBadge(
                    label: 'محايد',
                    variant: HancrBadgeVariant.neutral,
                  ),
                  const HancrBadge(
                    label: 'Primary',
                    variant: HancrBadgeVariant.primary,
                  ),
                ],
              ),
              const SizedBox(height: HancrSpacing.lg),
              const Wrap(
                spacing: HancrSpacing.sm,
                children: [
                  HancrTierBadge(tier: 'bronze'),
                  HancrTierBadge(tier: 'silver'),
                  HancrTierBadge(tier: 'gold'),
                  HancrTierBadge(tier: 'platinum'),
                  HancrTierBadge(tier: 'diamond'),
                ],
              ),
              const SizedBox(height: HancrSpacing.xxl),

              // ============ Search Bar ============
              _section('🔍 شريط البحث الرئيسي'),
              HancrSearchBar(onTap: () => _snack('Search tapped')),
              const SizedBox(height: HancrSpacing.lg),
              Row(
                children: [
                  HancrPillFilter(
                    label: 'الآن',
                    icon: Icons.access_time_rounded,
                    onTap: () => _snack('Time'),
                  ),
                  const SizedBox(width: HancrSpacing.sm),
                  HancrPillFilter(
                    label: 'ذهاب',
                    icon: Icons.arrow_forward_rounded,
                    onTap: () => _snack('Direction'),
                  ),
                  const SizedBox(width: HancrSpacing.sm),
                  HancrPillFilter(
                    label: 'لي',
                    icon: Icons.person_rounded,
                    onTap: () => _snack('For'),
                    selected: true,
                  ),
                ],
              ),
              const SizedBox(height: HancrSpacing.xxl),

              // ============ Service Tiles ============
              _section('🚗 خدمات الراكب'),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 4,
                mainAxisSpacing: HancrSpacing.md,
                crossAxisSpacing: HancrSpacing.md,
                childAspectRatio: 0.85,
                children: [
                  HancrServiceTile(
                    label: 'رحلة',
                    icon: Icons.directions_car_rounded,
                    onTap: () => _snack('Ride'),
                    badge: 'خصم',
                    iconColor: HancrColors.violet,
                  ),
                  HancrServiceTile(
                    label: 'توصيل',
                    icon: Icons.delivery_dining_rounded,
                    onTap: () => _snack('Delivery'),
                    iconColor: HancrColors.success,
                  ),
                  HancrServiceTile(
                    label: 'طرد',
                    icon: Icons.inventory_2_rounded,
                    onTap: () => _snack('Parcel'),
                    iconColor: HancrColors.warning,
                  ),
                  HancrServiceTile(
                    label: 'إيجار',
                    icon: Icons.event_seat_rounded,
                    onTap: () => _snack('Rental'),
                    iconColor: HancrColors.info,
                  ),
                ],
              ),
              const SizedBox(height: HancrSpacing.xxl),

              // ============ Promo Banners ============
              _section('📣 البانرات الإعلانية'),
              HancrPromoBanner(
                title: 'اربح 500 ميل!',
                subtitle: 'ادعُ صديقاً واحصل على مكافأة',
                icon: Icons.card_giftcard_rounded,
                actionLabel: 'ابدأ الآن',
                onTap: () => _snack('Invite'),
              ),
              const SizedBox(height: HancrSpacing.md),
              HancrPromoBanner(
                title: 'أكمل الدفع: 170.71 ر.س',
                subtitle: 'فاتورتك جاهزة',
                icon: Icons.notifications_active_rounded,
                actionLabel: 'ادفع الآن',
                variant: HancrPromoVariant.warning,
                onTap: () => _snack('Pay'),
              ),
              const SizedBox(height: HancrSpacing.md),
              HancrPromoBanner(
                title: 'خصم 40% على الـ 3 طلبات القادمة',
                subtitle: 'استخدم كود: HANCR40',
                icon: Icons.local_fire_department_rounded,
                actionLabel: 'استخدم الآن',
                variant: HancrPromoVariant.navy,
                onTap: () => _snack('Promo'),
              ),
              const SizedBox(height: HancrSpacing.md),
              HancrPromoBanner(
                title: 'وصلت للمستوى الذهبي 🏆',
                subtitle: 'استمتع بمزايا حصرية',
                icon: Icons.workspace_premium_rounded,
                variant: HancrPromoVariant.gold,
                onTap: () => _snack('Gold tier'),
              ),
              const SizedBox(height: HancrSpacing.xxl),

              // ============ Location Input ============
              _section('📍 إدخال الوجهة'),
              HancrCard(
                child: HancrLocationInput(
                  originText: 'موقعي الحالي',
                  destinationText: null,
                  onOriginTap: () => _snack('Origin'),
                  onDestinationTap: () => _snack('Destination'),
                ),
              ),
              const SizedBox(height: HancrSpacing.lg),
              HancrCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    HancrSavedPlaceRow(
                      label: 'المنزل',
                      subtitle: 'الرياض، حي الياسمين',
                      icon: Icons.home_rounded,
                      iconColor: HancrColors.violetDeep,
                      iconBackground: HancrColors.violetLight,
                      onTap: () => _snack('Home'),
                    ),
                    const Divider(height: 1, color: HancrColors.divider),
                    HancrSavedPlaceRow(
                      label: 'العمل',
                      subtitle: 'الرياض، شارع الملك فهد',
                      icon: Icons.work_outline_rounded,
                      iconColor: HancrColors.navy,
                      iconBackground: HancrColors.surfaceMute,
                      onTap: () => _snack('Work'),
                    ),
                    const Divider(height: 1, color: HancrColors.divider),
                    HancrSavedPlaceRow(
                      label: 'إضافة موقع جديد',
                      icon: Icons.add_rounded,
                      iconColor: HancrColors.violet,
                      iconBackground: HancrColors.surfaceMute,
                      onTap: () => _snack('Add'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: HancrSpacing.xxl),

              // ============ Car Art (SVG) ============
              _section('🚗 رسوم السيارات (SVG Assets)'),
              _CarArtShowcase(),
              const SizedBox(height: HancrSpacing.xxl),

              // ============ Trip Options ============
              _section('🚙 اختيار الفئة (Service Tier)'),
              HancrTripOption(
                tierName: 'HANCR Eco',
                priceLabel: '18 ر.س',
                eta: '3 د • وصول قريب',
                subtitle: 'سيارات اقتصادية، توفير أكبر',
                icon: Icons.directions_car_filled_rounded,
                selected: _selectedTrip == 0,
                badge: 'أرخص',
                onTap: () => setState(() => _selectedTrip = 0),
              ),
              const SizedBox(height: HancrSpacing.sm),
              HancrTripOption(
                tierName: 'HANCR Standard',
                priceLabel: '25 ر.س',
                discountedPrice: '32 ر.س',
                eta: '2 د • وصول سريع',
                icon: Icons.local_taxi_rounded,
                selected: _selectedTrip == 1,
                badge: 'أسرع',
                onTap: () => setState(() => _selectedTrip = 1),
              ),
              const SizedBox(height: HancrSpacing.sm),
              HancrTripOption(
                tierName: 'HANCR Plus',
                priceLabel: '35 ر.س',
                eta: '4 د',
                subtitle: 'سيارات حديثة وفاخرة',
                icon: Icons.car_rental_rounded,
                selected: _selectedTrip == 2,
                onTap: () => setState(() => _selectedTrip = 2),
              ),
              const SizedBox(height: HancrSpacing.xxl),

              // ============ Cards ============
              _section('🗂️ البطاقات'),
              const HancrCard(
                child: Row(
                  children: [
                    Icon(Icons.info_outline_rounded,
                        color: HancrColors.violet, size: 20),
                    SizedBox(width: HancrSpacing.md),
                    Expanded(
                      child: Text(
                        'هذه بطاقة flat بحدّ خفيف (الافتراضي)',
                        style: TextStyle(fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: HancrSpacing.md),
              HancrCard.elevated(
                child: const Row(
                  children: [
                    Icon(Icons.layers_rounded,
                        color: HancrColors.violet, size: 20),
                    SizedBox(width: HancrSpacing.md),
                    Expanded(
                      child: Text(
                        'بطاقة elevated مع ظل خفيف',
                        style: TextStyle(fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: HancrSpacing.md),
              HancrCard.selected(
                onTap: () => _snack('Selected card'),
                child: const Row(
                  children: [
                    Icon(Icons.check_circle_rounded,
                        color: HancrColors.violet, size: 20),
                    SizedBox(width: HancrSpacing.md),
                    Expanded(
                      child: Text(
                        'بطاقة selected — حدّ بنفسجي + ظل ملوَّن',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: HancrSpacing.md),
              HancrCard.dark(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        HancrTierBadge(tier: 'gold'),
                        SizedBox(width: HancrSpacing.sm),
                        Text(
                          'مستواك الحالي',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: HancrSpacing.md),
                    const Text(
                      '2,450 ميل',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: HancrSpacing.xs),
                    const Text(
                      '550 ميل للوصول لمستوى الماس',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: HancrSpacing.md),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(HancrRadius.pill),
                      child: const LinearProgressIndicator(
                        value: 0.815,
                        minHeight: 8,
                        backgroundColor: Colors.white24,
                        valueColor: AlwaysStoppedAnimation(HancrColors.violet),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: HancrSpacing.xxl),

              // ============ Inputs ============
              _section('📝 حقول الإدخال'),
              const TextField(
                decoration: InputDecoration(
                  labelText: 'الاسم الكامل',
                  hintText: 'أدخل اسمك',
                  prefixIcon: Icon(Icons.person_outline_rounded),
                ),
              ),
              const SizedBox(height: HancrSpacing.md),
              const TextField(
                decoration: InputDecoration(
                  labelText: 'رقم الجوال',
                  hintText: '5XX XXX XXX',
                  prefixIcon: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Center(
                      widthFactor: 1,
                      child: Text(
                        '🇸🇦 +966',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: HancrSpacing.huge),
            ],
          ),
        ),
      ),
    );
  }

  Widget _section(String title) {
    return Padding(
      padding: const EdgeInsets.only(
        top: HancrSpacing.md,
        bottom: HancrSpacing.md,
      ),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w800,
          color: HancrColors.navy,
        ),
      ),
    );
  }
}

class _CarArtShowcase extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: BoxDecoration(
            color: AuroraColors.ash,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AuroraColors.border),
          ),
          child: Wrap(
            spacing: 12,
            runSpacing: 12,
            alignment: WrapAlignment.spaceAround,
            children: CarType.values.map((t) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CarArt(type: t, size: const Size(100, 64)),
                  const SizedBox(height: 4),
                  Text(
                    t.name,
                    style: TextStyle(
                      fontSize: 10,
                      color: AuroraColors.textHint,
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: HancrSpacing.md),
      ],
    );
  }
}

class _ColorPalette extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final swatches = [
      ('Navy', HancrColors.navy),
      ('Violet', HancrColors.violet),
      ('Violet Deep', HancrColors.violetDeep),
      ('Purple', HancrColors.purple),
      ('Cream', HancrColors.cream),
      ('Success', HancrColors.success),
      ('Warning', HancrColors.warning),
      ('Error', HancrColors.error),
    ];

    return Wrap(
      spacing: HancrSpacing.sm,
      runSpacing: HancrSpacing.sm,
      children: swatches.map((s) {
        final isDark =
            ThemeData.estimateBrightnessForColor(s.$2) == Brightness.dark;
        return Container(
          width: 88,
          height: 72,
          decoration: BoxDecoration(
            color: s.$2,
            borderRadius: BorderRadius.circular(HancrRadius.md),
            border: Border.all(color: HancrColors.divider),
          ),
          padding: const EdgeInsets.all(HancrSpacing.sm),
          alignment: Alignment.bottomLeft,
          child: Text(
            s.$1,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : HancrColors.textPrimary,
            ),
          ),
        );
      }).toList(),
    );
  }
}
