import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/widgets/car_art.dart';
import '../../core/motion/motion.dart';
import '../home/aurora_home_tab.dart';
import '../rides/rides_tab.dart';
import '../profile/aurora_profile_tab.dart';
import '../commuter/aurora_commuter_screen.dart';
import '../airport/aurora_airport_screen.dart';
import '../bundles/aurora_bundles_screen.dart';
import '../carpool/aurora_carpool_screen.dart';
import '../grocery/aurora_grocery_screen.dart';

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
      // انتقال متلاشٍ ناعم بين التبويبات.
      body: AnimatedSwitcher(
        duration: Motion.dur(Motion.base),
        switchInCurve: Motion.decelerate,
        switchOutCurve: Motion.accelerate,
        transitionBuilder: (child, anim) => FadeTransition(
          opacity: anim,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 0.02),
              end: Offset.zero,
            ).animate(anim),
            child: child,
          ),
        ),
        child: KeyedSubtree(
          key: ValueKey<int>(_currentIndex),
          child: _tabs[_currentIndex],
        ),
      ),
      bottomNavigationBar: AuroraBottomNav(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        onCenterPressed: () => context.push('/ai'),
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
          padding: EdgeInsets.fromLTRB(
            AuroraSpacing.lg,
            AuroraSpacing.lg,
            AuroraSpacing.lg,
            AuroraBottomNav.height +
                MediaQuery.of(context).viewPadding.bottom +
                AuroraSpacing.lg,
          ),
          children: [
            const SizedBox(height: AuroraSpacing.md),
            Text(tr('nav_services'), style: AuroraText.displayMedium),
            const SizedBox(height: AuroraSpacing.lg),

            // ─── شريط بطل بسيارات (sedan/suv/bike) ───
            _carHero(),
            const SizedBox(height: AuroraSpacing.xl),

            _section(tr('goAnywhere')),
            const SizedBox(height: AuroraSpacing.md),
            _grid(context, [
              _ServiceItem(
                  icon: Icons.local_taxi, label: tr('ride'), isRide: true),
              _ServiceItem(
                  icon: Icons.schedule,
                  label: tr('scheduledRide'),
                  bookServiceType: ''),
              _ServiceItem(
                  icon: Icons.av_timer,
                  label: tr('hourly'),
                  bookServiceType: 'HourlyChauffeur'),
              _ServiceItem(
                  icon: Icons.inventory_2_outlined,
                  label: tr('parcel'),
                  bookServiceType: 'PackageDelivery'),
              _ServiceItem(
                  icon: Icons.school,
                  label: tr('subType_school'),
                  customRoute: 'school'),
              _ServiceItem(
                  icon: Icons.medication,
                  label: tr('subType_medical'),
                  customRoute: 'medical'),
              _ServiceItem(
                  icon: Icons.airline_seat_recline_normal,
                  label: tr('subType_vip'),
                  customRoute: 'vip'),
              _ServiceItem(
                  icon: Icons.flight,
                  label: tr('airportPickup'),
                  customRoute: 'airport'),
              _ServiceItem(
                  icon: Icons.commute,
                  label: tr('subType_commuter'),
                  customRoute: 'commuter'),
              _ServiceItem(
                  icon: Icons.groups,
                  label: tr('carpool'),
                  customRoute: 'carpool'),
              _ServiceItem(
                  icon: Icons.shopping_basket,
                  label: tr('groceryRun'),
                  customRoute: 'grocery'),
              _ServiceItem(
                  icon: Icons.confirmation_number_outlined,
                  label: tr('rideBundles'),
                  customRoute: 'bundles'),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _section(String title) => Text(title, style: AuroraText.titleMedium);

  /// شريط بطل: تدرّج ember + ثلاث مركبات مرسومة بالكود.
  Widget _carHero() {
    return Container(
      height: 120,
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AuroraColors.ember.withValues(alpha: 0.22),
            AuroraColors.coal,
          ],
        ),
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(color: AuroraColors.borderGlow),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          const CarArt(type: CarType.sedan, size: Size(96, 52)).popIn(index: 0),
          const CarArt(type: CarType.suv, size: Size(96, 52)).popIn(index: 1),
          const CarArt(type: CarType.bike, size: Size(70, 52)).popIn(index: 2),
        ],
      ),
    );
  }

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
        size: 80,
        onTap: () {
          final item = items[i];
          if (item.customRoute != null) {
            final route = item.customRoute!;
            if (route == 'airport') {
              Navigator.of(ctx).push(MaterialPageRoute(
                builder: (_) => const AuroraAirportScreen(),
              ));
            } else if (route == 'carpool') {
              Navigator.of(ctx).push(MaterialPageRoute(
                builder: (_) => const AuroraCarpoolScreen(),
              ));
            } else if (route == 'grocery') {
              Navigator.of(ctx).push(MaterialPageRoute(
                builder: (_) => const AuroraGroceryScreen(),
              ));
            } else if (route == 'bundles') {
              Navigator.of(ctx).push(MaterialPageRoute(
                builder: (_) => const AuroraBundlesScreen(),
              ));
            } else if (route == 'vip') {
              // VIP = حجز فوري بخدمة VIP مع إمكانية تفضيل سائق
              ctx.push('/book',
                  extra: {'preferServiceType': 'RideSharing', 'vip': true});
            } else {
              // commuter | school | medical → AuroraCommuterScreen
              Navigator.of(ctx).push(MaterialPageRoute(
                builder: (_) => AuroraCommuterScreen(subscriptionType: route),
              ));
            }
            return;
          }
          if (item.isRide || item.bookServiceType == '') {
            ctx.push('/book');
          } else if (item.bookServiceType != null) {
            ctx.push('/book',
                extra: {'preferServiceType': item.bookServiceType});
          } else {
            AuroraToast.comingSoon(ctx, feature: item.label);
          }
        },
      ).popIn(index: i),
    );
  }
}

class _ServiceItem {
  final IconData icon;
  final String label;
  final bool isRide;

  /// إن لم يكن null، يفتح شاشة الحجز بنوع خدمة مُفضَّل (أو رحلة عادية عند '').
  final String? bookServiceType;

  /// مسار شاشة مخصّصة: 'school' | 'medical' | 'vip' | 'airport' | 'commuter'
  final String? customRoute;
  const _ServiceItem(
      {required this.icon,
      required this.label,
      this.isRide = false,
      this.customRoute,
      this.bookServiceType});
}
