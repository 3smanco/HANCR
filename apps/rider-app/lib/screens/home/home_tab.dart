import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_state.dart';
import '../../core/config/app_config.dart';
import '../../core/models/order_model.dart';
import '../../core/models/service_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';
import 'widgets/destination_bottom_sheet.dart';
import 'widgets/order_options_sheet.dart';
import 'widgets/service_selector_sheet.dart';

/// HomeTab — الشاشة الرئيسية للراكب بنمط Uber 2024
///
/// البنية:
///  - Header: greeting + avatar + bell
///  - SearchBar: "إلى أين؟" مع pill "الآن"
///  - PromoBanner carousel
///  - Service Grid (4 خدمات)
///  - Saved places (المنزل، العمل)
///  - "حولك" — خريطة صغيرة بسائقين قريبين
class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  GeoPoint? _origin;
  String _originAddress = '';
  GoogleMapController? _miniMapCtrl;
  LatLng _miniMapCenter = const LatLng(
    AppConfig.defaultLat,
    AppConfig.defaultLng,
  );
  bool _locationLoaded = false;

  @override
  void initState() {
    super.initState();
    _requestLocation();
  }

  Future<void> _requestLocation() async {
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.whileInUse ||
          perm == LocationPermission.always) {
        final pos = await Geolocator.getCurrentPosition();
        if (!mounted) return;
        setState(() {
          _origin = GeoPoint(lat: pos.latitude, lng: pos.longitude);
          _originAddress = 'موقعك الحالي';
          _miniMapCenter = LatLng(pos.latitude, pos.longitude);
          _locationLoaded = true;
        });
        _miniMapCtrl?.animateCamera(
          CameraUpdate.newLatLngZoom(_miniMapCenter, 14),
        );
      }
    } catch (_) {
      // permission denied / location error — gracefully degrade
    }
  }

  // ───── Flow: destination → service → options
  Future<void> _startBooking({ServiceModel? preselectedService}) async {
    if (_origin == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('جارٍ تحديد موقعك...'),
          duration: Duration(seconds: 2),
        ),
      );
      await _requestLocation();
      if (_origin == null) return;
    }

    final destResult = await showModalBottomSheet<Map<String, dynamic>?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DestinationBottomSheet(
        origin: _origin,
        originAddress: _originAddress,
      ),
    );

    if (!mounted || destResult == null) return;
    final destination = destResult['point'] as GeoPoint;
    final destinationAddress = destResult['address'] as String;

    // Service selection (skip if preselected)
    final service = preselectedService ??
        await showModalBottomSheet<ServiceModel?>(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => ServiceSelectorSheet(
            origin: _origin!,
            destination: destination,
          ),
        );

    if (!mounted || service == null) return;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => OrderOptionsSheet(
        origin: _origin!,
        destination: destination,
        originAddress: _originAddress,
        destinationAddress: destinationAddress,
        service: service,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HancrColors.background,
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            _Header(onLocationRefresh: _requestLocation),
            const SizedBox(height: HancrSpacing.lg),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: HancrSpacing.lg),
              child: HancrSearchBar(
                onTap: _startBooking,
                placeholder: 'إلى أين؟',
                timeLabel: 'الآن',
              ),
            ),
            const SizedBox(height: HancrSpacing.xl),

            // ── Promo Banner ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: HancrSpacing.lg),
              child: _PromoCarousel(onTap: _startBooking),
            ),
            const SizedBox(height: HancrSpacing.xxl),

            // ── Services Grid ──
            const _SectionHeader(title: 'الخدمات', actionLabel: 'الكل'),
            const SizedBox(height: HancrSpacing.md),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: HancrSpacing.lg),
              child: GridView.count(
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
                    iconColor: HancrColors.violet,
                    badge: 'خصم',
                    onTap: _startBooking,
                  ),
                  HancrServiceTile(
                    label: 'توصيل',
                    icon: Icons.delivery_dining_rounded,
                    iconColor: HancrColors.success,
                    onTap: _startBooking,
                  ),
                  HancrServiceTile(
                    label: 'طرد',
                    icon: Icons.inventory_2_rounded,
                    iconColor: HancrColors.warning,
                    onTap: _startBooking,
                  ),
                  HancrServiceTile(
                    label: 'إيجار',
                    icon: Icons.event_seat_rounded,
                    iconColor: HancrColors.info,
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('🚧 خدمة الإيجار قريباً'),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: HancrSpacing.xxl),

            // ── Saved Places ──
            const _SectionHeader(title: 'أماكنك المحفوظة'),
            const SizedBox(height: HancrSpacing.md),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: HancrSpacing.lg),
              child: HancrCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    HancrSavedPlaceRow(
                      label: 'المنزل',
                      subtitle: 'اضغط لإضافة عنوان المنزل',
                      icon: Icons.home_rounded,
                      iconColor: HancrColors.violetDeep,
                      iconBackground: HancrColors.violetLight,
                      onTap: _startBooking,
                    ),
                    const Divider(height: 1, color: HancrColors.divider),
                    HancrSavedPlaceRow(
                      label: 'العمل',
                      subtitle: 'اضغط لإضافة عنوان العمل',
                      icon: Icons.work_outline_rounded,
                      iconColor: HancrColors.navy,
                      iconBackground: HancrColors.surfaceMute,
                      onTap: _startBooking,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: HancrSpacing.xxl),

            // ── Around you (mini map) ──
            const _SectionHeader(title: 'حولك'),
            const SizedBox(height: HancrSpacing.md),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: HancrSpacing.lg),
              child: _MiniMap(
                center: _miniMapCenter,
                ready: _locationLoaded,
                onCreated: (c) {
                  _miniMapCtrl = c;
                  if (_locationLoaded) {
                    c.animateCamera(
                      CameraUpdate.newLatLngZoom(_miniMapCenter, 14),
                    );
                  }
                },
                onTap: _startBooking,
              ),
            ),
            const SizedBox(height: HancrSpacing.huge),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.onLocationRefresh});

  final VoidCallback onLocationRefresh;

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء سعيد';
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<RiderBloc, RiderState>(
      builder: (ctx, state) {
        final name = state is RiderLoaded ? state.rider.displayName : '';
        final firstName = name.split(' ').first;
        final initial = name.isNotEmpty ? name[0].toUpperCase() : 'H';

        return Padding(
          padding: const EdgeInsets.fromLTRB(
            HancrSpacing.lg,
            HancrSpacing.md,
            HancrSpacing.lg,
            0,
          ),
          child: Row(
            children: [
              // Avatar
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: HancrColors.violetGradient,
                  shape: BoxShape.circle,
                  boxShadow: HancrShadows.violetGlow,
                ),
                child: Center(
                  child: Text(
                    initial,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: HancrSpacing.md),
              // Greeting
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${_greeting()} 👋',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: HancrColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      firstName.isEmpty ? 'صديقنا' : firstName,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: HancrColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              // Bell
              Stack(
                children: [
                  HancrIconButton(
                    icon: Icons.notifications_none_rounded,
                    backgroundColor: HancrColors.surface,
                    foregroundColor: HancrColors.textPrimary,
                    shadow: true,
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('لا توجد إشعارات')),
                      );
                    },
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: HancrColors.violet,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Promo Carousel
// ─────────────────────────────────────────────────────────────────────────────

class _PromoCarousel extends StatefulWidget {
  const _PromoCarousel({required this.onTap});

  final VoidCallback onTap;

  @override
  State<_PromoCarousel> createState() => _PromoCarouselState();
}

class _PromoCarouselState extends State<_PromoCarousel> {
  final _controller = PageController(viewportFraction: 1.0);
  int _current = 0;

  late final List<_PromoCard> _promos;

  @override
  void initState() {
    super.initState();
    _promos = [
      _PromoCard(
        title: 'اربح 500 ميل',
        subtitle: 'ادعُ صديقاً واحصل على مكافأة',
        icon: Icons.card_giftcard_rounded,
        actionLabel: 'ابدأ الآن',
        variant: HancrPromoVariant.violet,
      ),
      _PromoCard(
        title: 'خصم 40% على 3 طلبات',
        subtitle: 'استخدم كود: HANCR40',
        icon: Icons.local_fire_department_rounded,
        actionLabel: 'استخدم الآن',
        variant: HancrPromoVariant.navy,
      ),
      _PromoCard(
        title: 'وصلت للمستوى الذهبي 🏆',
        subtitle: 'استمتع بمزايا حصرية',
        icon: Icons.workspace_premium_rounded,
        variant: HancrPromoVariant.gold,
      ),
    ];
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 88,
          child: PageView.builder(
            controller: _controller,
            itemCount: _promos.length,
            onPageChanged: (i) => setState(() => _current = i),
            itemBuilder: (_, i) {
              final p = _promos[i];
              return HancrPromoBanner(
                title: p.title,
                subtitle: p.subtitle,
                icon: p.icon,
                actionLabel: p.actionLabel,
                variant: p.variant,
                onTap: widget.onTap,
              );
            },
          ),
        ),
        const SizedBox(height: HancrSpacing.sm),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(_promos.length, (i) {
            final active = i == _current;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: active ? 16 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: active ? HancrColors.violet : HancrColors.borderStrong,
                borderRadius: BorderRadius.circular(3),
              ),
            );
          }),
        ),
      ],
    );
  }
}

class _PromoCard {
  _PromoCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    this.actionLabel,
    required this.variant,
  });
  final String title;
  final String subtitle;
  final IconData icon;
  final String? actionLabel;
  final HancrPromoVariant variant;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.actionLabel, this.onAction});

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: HancrSpacing.lg),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: HancrColors.textPrimary,
              ),
            ),
          ),
          if (actionLabel != null)
            TextButton(
              onPressed: onAction,
              child: Text(
                actionLabel!,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: HancrColors.violet,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini Map
// ─────────────────────────────────────────────────────────────────────────────

class _MiniMap extends StatelessWidget {
  const _MiniMap({
    required this.center,
    required this.ready,
    required this.onCreated,
    required this.onTap,
  });

  final LatLng center;
  final bool ready;
  final void Function(GoogleMapController) onCreated;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(HancrRadius.lg),
      child: Container(
        height: 180,
        color: HancrColors.surfaceMute,
        child: Stack(
          children: [
            Positioned.fill(
              child: GoogleMap(
                initialCameraPosition: CameraPosition(
                  target: center,
                  zoom: 14,
                ),
                onMapCreated: onCreated,
                myLocationEnabled: ready,
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
                mapToolbarEnabled: false,
                liteModeEnabled: true,
              ),
            ),
            Positioned.fill(
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: onTap,
                  splashColor:
                      HancrColors.violet.withValues(alpha: 0.1),
                ),
              ),
            ),
            Positioned(
              left: HancrSpacing.md,
              bottom: HancrSpacing.md,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: HancrSpacing.md,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(HancrRadius.pill),
                  boxShadow: HancrShadows.card,
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.location_on_rounded,
                      size: 14,
                      color: HancrColors.violet,
                    ),
                    SizedBox(width: 4),
                    Text(
                      'انقر لرؤية الخريطة',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: HancrColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
