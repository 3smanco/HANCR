import 'package:flutter/material.dart';
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
      body: IndexedStack(
        index: _currentIndex,
        children: _tabs,
      ),
      bottomNavigationBar: AuroraBottomNav(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        onCenterPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('HANCR AI Assistant قريباً ✨'),
              backgroundColor: AuroraColors.ash,
            ),
          );
        },
        items: const [
          AuroraNavItem(
            icon: Icons.home_outlined,
            activeIcon: Icons.home,
            label: 'الرئيسية',
          ),
          AuroraNavItem(
            icon: Icons.grid_view_outlined,
            activeIcon: Icons.grid_view,
            label: 'الخدمات',
          ),
          AuroraNavItem(
            icon: Icons.receipt_long_outlined,
            activeIcon: Icons.receipt_long,
            label: 'النشاط',
          ),
          AuroraNavItem(
            icon: Icons.person_outline,
            activeIcon: Icons.person,
            label: 'حسابي',
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
            Text('الخدمات', style: AuroraText.displayMedium),
            const SizedBox(height: AuroraSpacing.xxl),

            _section('انتقل لأي مكان'),
            const SizedBox(height: AuroraSpacing.md),
            _grid([
              const _ServiceItem(icon: Icons.local_taxi, label: 'رحلة'),
              const _ServiceItem(icon: Icons.electric_scooter, label: 'دراجة'),
              const _ServiceItem(
                  icon: Icons.car_rental, label: 'تأجير', badge: 'Promo'),
              const _ServiceItem(icon: Icons.schedule, label: 'حجز مسبق'),
              const _ServiceItem(icon: Icons.groups, label: 'رحلة جماعية'),
              const _ServiceItem(icon: Icons.av_timer, label: 'بالساعة'),
              const _ServiceItem(icon: Icons.school, label: 'للطلاب'),
              const _ServiceItem(icon: Icons.airline_seat_recline_normal, label: 'فاخرة'),
            ]),

            const SizedBox(height: AuroraSpacing.xxl),

            _section('أوصِل أي شيء'),
            const SizedBox(height: AuroraSpacing.md),
            _grid([
              const _ServiceItem(
                  icon: Icons.restaurant, label: 'طعام', badge: 'Promo'),
              const _ServiceItem(
                  icon: Icons.shopping_basket, label: 'بقالة', badge: 'Promo'),
              const _ServiceItem(icon: Icons.medication, label: 'دواء'),
              const _ServiceItem(icon: Icons.local_florist, label: 'هدايا'),
              const _ServiceItem(icon: Icons.local_grocery_store, label: 'مستلزمات'),
              const _ServiceItem(icon: Icons.baby_changing_station, label: 'أطفال'),
              const _ServiceItem(icon: Icons.spa, label: 'العناية'),
              const _ServiceItem(icon: Icons.coffee, label: 'قهوة'),
            ]),

            const SizedBox(height: AuroraSpacing.huge),
          ],
        ),
      ),
    );
  }

  Widget _section(String title) =>
      Text(title, style: AuroraText.titleMedium);

  Widget _grid(List<_ServiceItem> items) {
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
      itemBuilder: (_, i) => AuroraIconTile(
        icon: items[i].icon,
        label: items[i].label,
        badge: items[i].badge,
        size: 80,
        onTap: () {},
      ),
    );
  }
}

class _ServiceItem {
  final IconData icon;
  final String label;
  final String? badge;
  const _ServiceItem({required this.icon, required this.label, this.badge});
}
