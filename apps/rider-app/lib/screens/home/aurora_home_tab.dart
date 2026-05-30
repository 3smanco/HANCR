import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/models/order_model.dart';
import '../../core/widgets/aurora/aurora.dart';
import 'home_extras.dart';

/// AuroraHomeTab — شاشة الراكب الرئيسية بالـ Aurora design.
///
/// مستوحاة من تصميمك:
///  - Tab switcher (Rides / Delivery) في الأعلى
///  - Search bar "Where to?"
///  - Home/Work shortcuts
///  - Suggestions grid (Ride, 2-Wheels, Package, Rental Cars) مع Promo badges
///  - Large promo cards (Go in luxury, Ride in an EV)
class AuroraHomeTab extends StatefulWidget {
  const AuroraHomeTab({super.key});

  @override
  State<AuroraHomeTab> createState() => _AuroraHomeTabState();
}

class _AuroraHomeTabState extends State<AuroraHomeTab> {
  int _tabIndex = 0;

  @override
  Widget build(BuildContext context) {
    return AuroraBackground(
      child: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
          children: [
            const SizedBox(height: AuroraSpacing.md),

            // ─── Header: greeting + offers + notifications ───
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('مرحباً بك 👋', style: AuroraText.bodySmall),
                      Text('إلى أين تريد الذهاب؟',
                          style: AuroraText.titleMedium),
                    ],
                  ),
                ),
                _headerIcon(Icons.local_offer_outlined,
                    () => _open(context, const OffersScreen())),
                const SizedBox(width: AuroraSpacing.sm),
                _headerIcon(Icons.notifications_none,
                    () => _open(context, const NotificationsScreen())),
              ],
            ),

            const SizedBox(height: AuroraSpacing.lg),

            // ─── Tab Switcher ───
            AuroraTabSwitcher(
              selectedIndex: _tabIndex,
              onChanged: (i) => setState(() => _tabIndex = i),
              tabs: const [
                AuroraTabItem(icon: Icons.directions_car, label: 'رحلات'),
                AuroraTabItem(icon: Icons.delivery_dining, label: 'توصيل'),
              ],
            ),

            const SizedBox(height: AuroraSpacing.lg),

            // ─── Search bar ───
            AuroraSearchBar(
              hint: 'إلى أين؟',
              onTap: () => context.push('/book'),
              trailing: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AuroraSpacing.md, vertical: 6),
                decoration: BoxDecoration(
                  color: AuroraColors.smoke,
                  borderRadius: BorderRadius.circular(AuroraRadius.pill),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.schedule,
                        color: AuroraColors.textPrimary, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      'الآن',
                      style: AuroraText.bodySmall.copyWith(
                          color: AuroraColors.textPrimary,
                          fontWeight: FontWeight.w600),
                    ),
                    const Icon(Icons.keyboard_arrow_down,
                        color: AuroraColors.textPrimary, size: 18),
                  ],
                ),
              ),
            ),

            const SizedBox(height: AuroraSpacing.md),

            // ─── Saved place shortcut ───
            _savedPlaceRow(
              icon: Icons.home_outlined,
              title: 'المنزل',
              subtitle: 'حي العليا، الرياض',
              onTap: () => context.push('/book', extra: {
                'destination': const GeoPoint(lat: 24.6911, lng: 46.6850),
                'label': 'المنزل — حي العليا، الرياض',
              }),
            ),

            const SizedBox(height: AuroraSpacing.xl),

            // ─── Suggestions ───
            _sectionHeader('اقتراحات', 'عرض الكل'),
            const SizedBox(height: AuroraSpacing.md),
            SizedBox(
              height: 116,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  AuroraIconTile(
                    icon: Icons.local_taxi,
                    label: 'رحلة',
                    onTap: () => context.push('/book'),
                    selected: true,
                  ),
                  const SizedBox(width: AuroraSpacing.sm),
                  AuroraIconTile(
                    icon: Icons.electric_scooter,
                    label: 'دراجة',
                    onTap: () => AuroraToast.comingSoon(context, feature: 'الدراجات'),
                  ),
                  const SizedBox(width: AuroraSpacing.sm),
                  AuroraIconTile(
                    icon: Icons.inventory_2_outlined,
                    label: 'طرد',
                    badge: 'Promo',
                    onTap: () => AuroraToast.comingSoon(context, feature: 'توصيل الطرود'),
                  ),
                  const SizedBox(width: AuroraSpacing.sm),
                  AuroraIconTile(
                    icon: Icons.car_rental,
                    label: 'تأجير',
                    onTap: () => AuroraToast.comingSoon(context, feature: 'تأجير السيارات'),
                  ),
                ],
              ),
            ),

            const SizedBox(height: AuroraSpacing.xl),

            // ─── More ways ───
            Text(
              'طرق أخرى للتنقل',
              style: AuroraText.titleMedium,
            ),
            const SizedBox(height: AuroraSpacing.md),
            Row(
              children: [
                Expanded(
                  child: AuroraPromoCard(
                    title: 'سفر فاخر',
                    subtitle: 'سيارات فخمة عالية الفئة',
                    icon: Icons.diamond_outlined,
                    onTap: () => context.push('/book'),
                    gradientColors: [
                      AuroraColors.ember.withValues(alpha: 0.3),
                      AuroraColors.coal,
                    ],
                  ),
                ),
                const SizedBox(width: AuroraSpacing.md),
                Expanded(
                  child: AuroraPromoCard(
                    title: 'كهربائية',
                    subtitle: 'دلِّل نفسك بسيارة EV',
                    icon: Icons.electric_car_outlined,
                    onTap: () => context.push('/book'),
                    gradientColors: [
                      AuroraColors.info.withValues(alpha: 0.3),
                      AuroraColors.coal,
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: AuroraSpacing.xl),

            // ─── Schedule card (يشبه "Ride on your schedule") ───
            _scheduleCta(),

            const SizedBox(height: AuroraSpacing.xl),

            // ─── Offers section ───
            _sectionHeader('العروض والتخفيضات', 'عرض الكل'),
            const SizedBox(height: AuroraSpacing.md),
            SizedBox(
              height: 120,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _offerCard('خصم 25٪', 'لأول رحلة — كود WELCOME',
                      Icons.local_offer, AuroraColors.ember),
                  const SizedBox(width: AuroraSpacing.md),
                  _offerCard('عطلة نهاية الأسبوع', 'وفّر 15٪ الجمعة والسبت',
                      Icons.weekend, AuroraColors.info),
                  const SizedBox(width: AuroraSpacing.md),
                  _offerCard('رحلات ليلية', 'أسعار مخفّضة بعد منتصف الليل',
                      Icons.nightlight_round, AuroraColors.gold),
                ],
              ),
            ),

            // مساحة سفلية تكفي لتجاوز شريط التنقل العائم
            const SizedBox(height: 120),
          ],
        ),
      ),
    );
  }

  Widget _offerCard(String title, String subtitle, IconData icon, Color color) {
    return GestureDetector(
      onTap: () => _open(context, const OffersScreen()),
      child: Container(
        width: 240,
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color.withValues(alpha: 0.28), AuroraColors.coal],
          ),
          borderRadius: BorderRadius.circular(AuroraRadius.lg),
          border: Border.all(color: color.withValues(alpha: 0.5)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AuroraText.titleSmall),
                  const SizedBox(height: 4),
                  Text(subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AuroraText.bodySmall),
                ],
              ),
            ),
            const SizedBox(width: AuroraSpacing.sm),
            Icon(icon, color: color, size: 32),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  void _open(BuildContext context, Widget page) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
  }

  Widget _headerIcon(IconData icon, VoidCallback onTap) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        shape: BoxShape.circle,
        border: Border.all(color: AuroraColors.border),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: Icon(icon, color: AuroraColors.pearl, size: 20),
        ),
      ),
    );
  }

  Widget _sectionHeader(String title, String action) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: AuroraText.titleMedium),
        TextButton(
          onPressed: () => context.push('/book'),
          child: Text(
            action,
            style: AuroraText.bodyMedium.copyWith(color: AuroraColors.ember),
          ),
        ),
      ],
    );
  }

  Widget _savedPlaceRow({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return AuroraCard(
      padding: const EdgeInsets.symmetric(
          horizontal: AuroraSpacing.lg, vertical: AuroraSpacing.md),
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AuroraColors.smoke,
              borderRadius: BorderRadius.circular(AuroraRadius.sm),
              boxShadow: AuroraShadows.iconGlow,
            ),
            child: Icon(icon, color: AuroraColors.ember, size: 20),
          ),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AuroraText.titleSmall),
                const SizedBox(height: 2),
                Text(subtitle, style: AuroraText.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _scheduleCta() {
    return GestureDetector(
      onTap: () => AuroraToast.comingSoon(context, feature: 'الحجز المسبق'),
      child: Container(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        gradient: AuroraColors.emberGradient,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        boxShadow: AuroraShadows.emberGlow,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'احجز رحلة\nبجدولك',
                  style: AuroraText.titleMedium.copyWith(
                    color: AuroraColors.pearl,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: AuroraSpacing.xs),
                Text(
                  'حدِّد موعداً مسبقاً لرحلتك',
                  style: AuroraText.bodySmall.copyWith(
                    color: AuroraColors.pearl.withValues(alpha: 0.85),
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AuroraColors.pearl.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.schedule,
              color: AuroraColors.pearl,
              size: 30,
            ),
          ),
        ],
      ),
    ),
    );
  }
}
