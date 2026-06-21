import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/models/order_model.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/widgets/live_activity_bar.dart';
import '../../core/motion/motion.dart';
import '../commuter/aurora_commuter_screen.dart';
import '../airport/aurora_airport_screen.dart';
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
  List<Map<String, dynamic>> _banners = [];
  List<Map<String, dynamic>> _savedPlaces = [];
  bool _bannersLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBanners();
    _loadSavedPlaces();
  }

  Future<void> _loadSavedPlaces() async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(savedPlacesQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final list = (res.data?['savedPlaces'] as List<dynamic>?) ?? [];
      if (!mounted) return;
      setState(() =>
          _savedPlaces = list.map((e) => (e as Map<String, dynamic>)).toList());
    } catch (_) {
      // اختياري
    }
  }

  IconData _placeIcon(String type) {
    switch (type) {
      case 'home':
        return Icons.home_outlined;
      case 'work':
        return Icons.work_outline;
      default:
        return Icons.place_outlined;
    }
  }

  Future<void> _loadBanners() async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(appConfigQuery),
        fetchPolicy: FetchPolicy.cacheAndNetwork,
      ));
      final list = (res.data?['appConfig']?['banners'] as List<dynamic>?) ?? [];
      if (!mounted) return;
      setState(() {
        _banners = list.map((e) => (e as Map<String, dynamic>)).toList();
        _bannersLoading = false;
      });
    } catch (_) {
      // تجاهل بصمت — البانرات اختيارية
      if (mounted) setState(() => _bannersLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuroraBackground(
      child: SafeArea(
        bottom: false,
        child: ListView(
          // حشوة سفلية تتجاوز الشريط السفلي العائم (extendBody:true).
          padding: EdgeInsets.fromLTRB(
            AuroraSpacing.lg,
            0,
            AuroraSpacing.lg,
            AuroraBottomNav.height +
                MediaQuery.of(context).viewPadding.bottom +
                AuroraSpacing.lg,
          ),
          children: [
            const SizedBox(height: AuroraSpacing.md),

            // N9 — شريط النشاط الحي (يظهر فقط أثناء رحلة فعّالة)
            const LiveActivityBar(),

            // ─── Header: greeting + offers + notifications ───
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(tr('greeting'), style: AuroraText.bodySmall),
                      Text(tr('whereToGo'), style: AuroraText.titleMedium),
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

            // ─── Animated HANCR brand (بدل مبدّل رحلات/توصيل) ───
            const Center(child: _HancrBrandShimmer()),

            const SizedBox(height: AuroraSpacing.lg),

            // ─── Search bar ───
            AuroraSearchBar(
              hint: tr('whereTo'),
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
                    Icon(Icons.schedule,
                        color: AuroraColors.textPrimary, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      tr('now'),
                      style: AuroraText.bodySmall.copyWith(
                          color: AuroraColors.textPrimary,
                          fontWeight: FontWeight.w600),
                    ),
                    Icon(Icons.keyboard_arrow_down,
                        color: AuroraColors.textPrimary, size: 18),
                  ],
                ),
              ),
            ),

            const SizedBox(height: AuroraSpacing.md),

            // ─── Saved places shortcuts (dynamic) ───
            if (_savedPlaces.isEmpty)
              _savedPlaceRow(
                icon: Icons.add_location_alt_outlined,
                title: tr('addSavedPlace'),
                subtitle: tr('savedPlacesHint'),
                onTap: () => context.push('/book'),
              )
            else
              ..._savedPlaces.map((p) => Padding(
                    padding: const EdgeInsets.only(bottom: AuroraSpacing.sm),
                    child: _savedPlaceRow(
                      icon: _placeIcon(p['type'] as String? ?? 'other'),
                      title: p['label'] as String? ?? '',
                      subtitle: p['address'] as String? ?? '',
                      onTap: () => context.push('/book', extra: {
                        'destination': GeoPoint(
                          lat: (p['lat'] as num).toDouble(),
                          lng: (p['lng'] as num).toDouble(),
                        ),
                        'label': p['label'] as String? ?? '',
                      }),
                      onDelete: () => _deleteSavedPlace(p['id'] as int),
                    ),
                  )),

            const SizedBox(height: AuroraSpacing.xl),

            // ─── Suggestions ───
            _sectionHeader(tr('suggestions'), tr('viewAll')),
            const SizedBox(height: AuroraSpacing.md),
            SizedBox(
              height: 116,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  AuroraIconTile(
                    icon: Icons.local_taxi,
                    label: tr('ride'),
                    onTap: () => context.push('/book'),
                    selected: true,
                  ),
                  const SizedBox(width: AuroraSpacing.sm),
                  AuroraIconTile(
                    icon: Icons.flight,
                    label: tr('airportPickup'),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const AuroraAirportScreen(),
                      ),
                    ),
                  ),
                  const SizedBox(width: AuroraSpacing.sm),
                  AuroraIconTile(
                    icon: Icons.inventory_2_outlined,
                    label: tr('parcel'),
                    badge: 'Promo',
                    onTap: () => context.push('/book',
                        extra: {'preferServiceType': 'PackageDelivery'}),
                  ),
                  const SizedBox(width: AuroraSpacing.sm),
                  AuroraIconTile(
                    icon: Icons.school,
                    label: tr('subType_school'),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const AuroraCommuterScreen(
                            subscriptionType: 'school'),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: AuroraSpacing.xl),

            // ─── More ways ───
            Text(
              tr('otherWays'),
              style: AuroraText.titleMedium,
            ),
            const SizedBox(height: AuroraSpacing.md),
            Row(
              children: [
                Expanded(
                  child: AuroraPromoCard(
                    title: tr('luxury'),
                    subtitle: tr('luxurySub'),
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
                    title: tr('commuter'),
                    subtitle: tr('commuterSub'),
                    icon: Icons.commute,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const AuroraCommuterScreen(),
                      ),
                    ),
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

            // ─── Promo banners (SDUI من app-config) — مع skeleton أثناء التحميل ───
            if (_bannersLoading) ...[
              const SizedBox(height: AuroraSpacing.lg),
              SizedBox(
                height: 150,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: 3,
                  separatorBuilder: (_, __) =>
                      const SizedBox(width: AuroraSpacing.md),
                  itemBuilder: (_, __) => const Skeleton(
                    width: 300,
                    height: 150,
                    radius: AuroraRadius.lg,
                  ),
                ),
              ),
            ] else if (_banners.isNotEmpty) ...[
              const SizedBox(height: AuroraSpacing.lg),
              SizedBox(
                height: 150,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _banners.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(width: AuroraSpacing.md),
                  itemBuilder: (_, i) =>
                      _bannerCard(_banners[i]).fadeSlideIn(index: i),
                ),
              ),
            ],

            const SizedBox(height: AuroraSpacing.xl),

            // ─── Offers section ───
            _sectionHeader(tr('offers'), tr('viewAll')),
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

  Widget _bannerCard(Map<String, dynamic> b) {
    final imageUrl = b['imageUrl'] as String? ?? '';
    final title = b['title'] as String?;
    final subtitle = b['subtitle'] as String?;
    return GestureDetector(
      onTap: () {
        final link = b['link'] as String?;
        if (link != null && link.startsWith('/')) {
          context.push(link);
        }
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        child: SizedBox(
          width: 300,
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: AuroraColors.coal,
                  child: Icon(Icons.image_outlined,
                      color: AuroraColors.textSecondary, size: 32),
                ),
                loadingBuilder: (ctx, child, p) => p == null
                    ? child
                    : Container(color: AuroraColors.coal),
              ),
              if (title != null || subtitle != null)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Container(
                    padding: const EdgeInsets.all(AuroraSpacing.md),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black87],
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (title != null)
                          Text(title,
                              style: AuroraText.titleSmall
                                  .copyWith(color: AuroraColors.pearl)),
                        if (subtitle != null)
                          Text(subtitle,
                              style: AuroraText.bodySmall
                                  .copyWith(color: AuroraColors.pearl)),
                      ],
                    ),
                  ),
                ),
            ],
          ),
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
    VoidCallback? onDelete,
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
                Text(subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AuroraText.bodySmall),
              ],
            ),
          ),
          if (onDelete != null)
            IconButton(
              icon: Icon(Icons.delete_outline,
                  color: AuroraColors.textSecondary, size: 20),
              onPressed: onDelete,
            ),
        ],
      ),
    );
  }

  Future<void> _deleteSavedPlace(int id) async {
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(MutationOptions(
        document: gql(deleteSavedPlaceMutation),
        variables: {'id': id},
      ));
      _loadSavedPlaces();
    } catch (_) {}
  }

  Widget _scheduleCta() {
    return GestureDetector(
      onTap: () => context.push('/book'),
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
                  tr('scheduleTitle'),
                  style: AuroraText.titleMedium.copyWith(
                    color: AuroraColors.pearl,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: AuroraSpacing.xs),
                Text(
                  tr('scheduleSub'),
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
            child: Icon(
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

/// شعار HANCR متحرّك بلمعان ember يجتاح الحروف (بدل مبدّل رحلات/توصيل).
class _HancrBrandShimmer extends StatefulWidget {
  const _HancrBrandShimmer();
  @override
  State<_HancrBrandShimmer> createState() => _HancrBrandShimmerState();
}

class _HancrBrandShimmerState extends State<_HancrBrandShimmer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2600),
    )..repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AnimatedBuilder(
          animation: _c,
          builder: (context, child) {
            final t = _c.value; // 0..1 — موضع موجة اللمعان
            return ShaderMask(
              blendMode: BlendMode.srcIn,
              shaderCallback: (rect) => LinearGradient(
                begin: Alignment(-1.6 + 3.2 * t, 0),
                end: Alignment(-1.0 + 3.2 * t, 0),
                colors: const [
                  Color(0xFF7A4A2A),
                  Color(0xFFFF7A1A),
                  Color(0xFFFFE3C2),
                  Color(0xFFFF7A1A),
                  Color(0xFF7A4A2A),
                ],
                stops: const [0.0, 0.42, 0.5, 0.58, 1.0],
              ).createShader(rect),
              child: child,
            );
          },
          child: const Text(
            'HANCR',
            style: TextStyle(
              fontSize: 34,
              fontWeight: FontWeight.w900,
              letterSpacing: 8,
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          tr('tagline'),
          style: AuroraText.bodySmall.copyWith(
            color: AuroraColors.textSecondary,
            letterSpacing: 1.5,
          ),
        ),
      ],
    );
  }
}
