import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../home/aurora_home_tab.dart';
import '../rides/rides_tab.dart';
import '../profile/aurora_profile_tab.dart';

/// AuroraMainScreen — Bottom navigation الجديد بنمط Aurora:
/// Home / Services / [Center FAB] / Activity / Account
class AuroraMainScreen extends StatefulWidget {
  const AuroraMainScreen({super.key});

  @override
  State<AuroraMainScreen> createState() => _AuroraMainScreenState();
}

class _AuroraMainScreenState extends State<AuroraMainScreen> {
  int _currentIndex = 0;

  late final _tabs = const [
    AuroraHomeTab(),
    _ServicesTab(),
    RidesTab(),
    AuroraProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      extendBody: true,
      // نعرض التبويب النشط فقط (بدل IndexedStack) حتى لا يُنفّذ تبويب النشاط
      // طلب السجل تلقائياً ويطمس حالة الطلب النشط (active/awaiting-review).
      body: _tabs[_currentIndex],
      bottomNavigationBar: AuroraBottomNav(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        onCenterPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(tr('aiSoon')),
              backgroundColor: AuroraColors.ash,
            ),
          );
        },
        items: [
          AuroraNavItem(
            icon: Icons.home_outlined,
            activeIcon: Icons.home,
            label: tr('nav_home'),
          ),
          AuroraNavItem(
            icon: Icons.grid_view_outlined,
            activeIcon: Icons.grid_view,
            label: tr('nav_services'),
          ),
          AuroraNavItem(
            icon: Icons.receipt_long_outlined,
            activeIcon: Icons.receipt_long,
            label: tr('nav_activity'),
          ),
          AuroraNavItem(
            icon: Icons.person_outline,
            activeIcon: Icons.person,
            label: tr('nav_account'),
          ),
        ],
      ),
    );
  }
}

// Placeholder services tab — يستخدم AuroraIconTile
class _ServicesTab extends StatelessWidget {
  const _ServicesTab();

  @override
  Widget build(BuildContext context) {
    return AuroraBackground(
      child: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.all(AuroraSpacing.lg),
          children: [
            const SizedBox(height: AuroraSpacing.md),
            Text(tr('nav_services'), style: AuroraText.displayMedium),
            const SizedBox(height: AuroraSpacing.xxl),

            _section(tr('goAnywhere')),
            const SizedBox(height: AuroraSpacing.md),
            _grid(context, [
              _ServiceItem(icon: Icons.local_taxi, label: tr('ride'), isRide: true),
              _ServiceItem(icon: Icons.electric_scooter, label: tr('bike')),
              _ServiceItem(
                  icon: Icons.car_rental, label: tr('rental'), badge: 'Promo'),
              _ServiceItem(
                  icon: Icons.schedule,
                  label: tr('scheduledRide'),
                  bookServiceType: ''),
              _ServiceItem(icon: Icons.groups, label: tr('groupRide')),
              _ServiceItem(
                  icon: Icons.av_timer,
                  label: tr('hourly'),
                  bookServiceType: 'HourlyChauffeur'),
              _ServiceItem(
                  icon: Icons.inventory_2_outlined,
                  label: tr('parcel'),
                  bookServiceType: 'PackageDelivery'),
              _ServiceItem(icon: Icons.school, label: tr('students')),
              _ServiceItem(icon: Icons.airline_seat_recline_normal, label: tr('premiumCat')),
            ]),

            const SizedBox(height: AuroraSpacing.xxl),

            _section(tr('deliverAnything')),
            const SizedBox(height: AuroraSpacing.md),
            _grid(context, [
              _ServiceItem(
                  icon: Icons.restaurant, label: tr('food'), badge: 'Promo'),
              _ServiceItem(
                  icon: Icons.shopping_basket, label: tr('grocery'), badge: 'Promo'),
              _ServiceItem(icon: Icons.medication, label: tr('medicine')),
              _ServiceItem(icon: Icons.local_florist, label: tr('gifts')),
              _ServiceItem(icon: Icons.local_grocery_store, label: tr('supplies')),
              _ServiceItem(icon: Icons.baby_changing_station, label: tr('kids')),
              _ServiceItem(icon: Icons.spa, label: tr('care')),
              _ServiceItem(icon: Icons.coffee, label: tr('coffee')),
            ]),

            const SizedBox(height: AuroraSpacing.huge),
          ],
        ),
      ),
    );
  }

  Widget _section(String title) =>
      Text(title, style: AuroraText.titleMedium);

  Widget _grid(BuildContext context, List<_ServiceItem> items) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: AuroraSpacing.sm,
        mainAxisSpacing: AuroraSpacing.md,
        childAspectRatio: 0.85,
      ),
      itemCount: items.length,
      itemBuilder: (ctx, i) => AuroraIconTile(
        icon: items[i].icon,
        label: items[i].label,
        badge: items[i].badge,
        size: 80,
        onTap: () {
          final item = items[i];
          if (item.isRide || item.bookServiceType == '') {
            ctx.push('/book');
          } else if (item.bookServiceType != null) {
            ctx.push('/book',
                extra: {'preferServiceType': item.bookServiceType});
          } else {
            AuroraToast.comingSoon(ctx, feature: item.label);
          }
        },
      ),
    );
  }
}

class _ServiceItem {
  final IconData icon;
  final String label;
  final String? badge;
  final bool isRide;
  /// إن لم يكن null، يفتح شاشة الحجز بنوع خدمة مُفضَّل (أو رحلة عادية عند '').
  final String? bookServiceType;
  const _ServiceItem(
      {required this.icon,
      required this.label,
      this.badge,
      this.isRide = false,
      this.bookServiceType});
}
