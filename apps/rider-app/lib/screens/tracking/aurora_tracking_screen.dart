import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show SystemSound, SystemSoundType;
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/motion/motion.dart';
import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_event.dart';
import '../../blocs/order/order_state.dart';
import '../../blocs/sos/sos_bloc.dart';
import '../../blocs/sos/sos_event.dart';
import '../../blocs/sos/sos_state.dart';
import '../../blocs/tracking/tracking_bloc.dart';
import '../../core/models/order_model.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/utils/external_launch.dart';
import '../sos/aurora_sos_button.dart';
import '../chat/aurora_chat_screen.dart';
import 'widgets/aurora_arrived_panel.dart';
import 'widgets/aurora_radar_beacon.dart';
import 'widgets/cancel_reason_sheet.dart';

/// AuroraTrackingScreen — تتبُّع الرحلة بنمط Aurora.
///
/// - خريطة dark style مع driver marker متحرِّك
/// - Bottom card مع driver info + actions (Call/Message/SOS/Share)
/// - Top SOS pill (compact)
/// - Auto-start/stop tracking subscription
class AuroraTrackingScreen extends StatefulWidget {
  const AuroraTrackingScreen({super.key});

  @override
  State<AuroraTrackingScreen> createState() => _AuroraTrackingScreenState();
}

class _AuroraTrackingScreenState extends State<AuroraTrackingScreen>
    with TickerProviderStateMixin {
  // نمط داكن غنيّ بالتفاصيل أثناء التتبّع: شوارع وأسماؤها + طرق سريعة بلون مميّز + مياه + معالم + مناطق.
  static const String _darkMapStyle = '''
[
  {"elementType":"geometry","stylers":[{"color":"#13100E"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#C9BDB6"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#0A0807"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#332C28"}]},
  {"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#B9ADA6"}]},
  {"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#3D352F"}]},
  {"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#FF7A1A"},{"saturation":-50},{"lightness":-30}]},
  {"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#E0CFC2"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#16243A"}]},
  {"featureType":"poi","elementType":"geometry","stylers":[{"color":"#1B2A1C"}]},
  {"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#9DB39B"}]},
  {"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#16301A"}]},
  {"featureType":"transit","elementType":"labels.text.fill","stylers":[{"color":"#B0A8C0"}]},
  {"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#5A4F47"}]},
  {"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#F0DECF"}]},
  {"featureType":"administrative.neighborhood","elementType":"labels.text.fill","stylers":[{"color":"#C2B3A6"}]}
]
''';

  GoogleMapController? _mapCtrl;
  BitmapDescriptor? _carIcon;
  DriverLocation? _lastDriverLoc;
  OrderModel? _lastOrder;

  // ─── انسياب علامة السيارة (موضع + اتجاه) ───
  final MarkerInterpolator _interp = MarkerInterpolator();
  LatLng? _carPos; // الموضع المُنعّم (يتحرّك بين تحديثات GPS)
  double _carBearing = 0;

  // ─── رسم المسار تدريجياً (مرة واحدة) ───
  final PolylineReveal _reveal = PolylineReveal();
  List<LatLng>? _routeReveal;

  @override
  void initState() {
    super.initState();
    _buildCarIcon();
  }

  @override
  void dispose() {
    _interp.dispose();
    _reveal.dispose();
    super.dispose();
  }

  /// يولّد علامة سيارة top-down مرسومة بالكود (CarMarkerFactory موحّد).
  Future<void> _buildCarIcon() async {
    final dpr =
        WidgetsBinding.instance.platformDispatcher.views.first.devicePixelRatio;
    final icon = await CarMarkerFactory.car(
      px: 62,
      dpr: dpr,
    );
    if (mounted) setState(() => _carIcon = icon);
  }

  /// يحرّك علامة السيارة بنعومة نحو آخر موقع GPS.
  void _moveCarTo(DriverLocation loc) {
    _interp.to(
      LatLng(loc.lat, loc.lng),
      vsync: this,
      duration: Motion.driverMove,
      onStep: (pos, bearing) {
        if (!mounted) return;
        setState(() {
          _carPos = pos;
          _carBearing = bearing;
        });
      },
    );
  }

  /// يرسم المسار تدريجياً مرة واحدة عند توفّره.
  void _revealRoute(List<LatLng> full) {
    if (_routeReveal != null) return;
    _reveal.reveal(
      full,
      vsync: this,
      duration: Motion.slow,
      onUpdate: (partial) {
        if (mounted) setState(() => _routeReveal = partial);
      },
    );
  }

  /// يفتح ورقة مشاركة بنص يصف الرحلة الحيّة (سائق، سيارة، ETA، وجهة).
  Future<void> _shareTrip(OrderModel order) async {
    final lines = <String>[
      tr('shareRideTitle'),
    ];
    if ((order.driverName ?? '').isNotEmpty) {
      lines.add('${tr('driver')}: ${order.driverName}');
    }
    final car = [order.carBrand, order.carModel]
        .where((s) => (s ?? '').isNotEmpty)
        .join(' ');
    if (car.isNotEmpty || (order.plateNumber ?? '').isNotEmpty) {
      lines.add('${tr('car')}: $car'
          '${(order.plateNumber ?? '').isNotEmpty ? ' • ${order.plateNumber}' : ''}');
    }
    if (order.addresses.length > 1) {
      lines.add('${tr('to')}: ${order.addresses.last}');
    }
    if (_lastDriverLoc != null) {
      lines.add('${tr('liveLocation')}: '
          'https://www.google.com/maps/search/?api=1&query=${_lastDriverLoc!.lat},${_lastDriverLoc!.lng}');
    }
    await Share.share(lines.join('\n'), subject: tr('shareRideTitle'));
  }

  /// يضبط الكاميرا لتضمّ الانطلاق والوجهة وموقع السائق.
  Future<void> _fitBounds() async {
    final order = _lastOrder;
    if (order == null || _mapCtrl == null) return;
    final pts = <LatLng>[
      for (final p in order.points) LatLng(p.lat, p.lng),
      if (_lastDriverLoc != null)
        LatLng(_lastDriverLoc!.lat, _lastDriverLoc!.lng),
    ];
    if (pts.isEmpty) return;
    var minLat = pts.first.latitude, maxLat = pts.first.latitude;
    var minLng = pts.first.longitude, maxLng = pts.first.longitude;
    for (final p in pts) {
      minLat = math.min(minLat, p.latitude);
      maxLat = math.max(maxLat, p.latitude);
      minLng = math.min(minLng, p.longitude);
      maxLng = math.max(maxLng, p.longitude);
    }
    try {
      await _mapCtrl!.animateCamera(CameraUpdate.newLatLngBounds(
        LatLngBounds(
          southwest: LatLng(minLat, minLng),
          northeast: LatLng(maxLat, maxLng),
        ),
        70,
      ));
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<SosBloc>(
          create: (_) => SosBloc()..add(const SosLoadRequested()),
        ),
        BlocProvider<TrackingBloc>(create: (_) => TrackingBloc()),
      ],
      child: MultiBlocListener(
        listeners: [
          BlocListener<SosBloc, SosState>(
            listenWhen: (p, c) => c is SosLoaded && c.toast != null,
            listener: (ctx, state) {
              if (state is SosLoaded && state.toast != null) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  SnackBar(
                    content: Text(state.toast!),
                    backgroundColor: AuroraColors.danger,
                  ),
                );
                ctx.read<SosBloc>().add(const SosToastCleared());
              }
            },
          ),
          BlocListener<OrderBloc, OrderState>(
            listenWhen: (p, c) {
              if (c is OrderError) return true;
              final pD = p is OrderActive ? p.order.driverId : null;
              final cD = c is OrderActive ? c.order.driverId : null;
              return pD != cD;
            },
            listener: (ctx, state) {
              if (state is OrderError) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: AuroraColors.danger,
                  ),
                );
                ctx.read<TrackingBloc>().add(const TrackingStopped());
                ctx.go('/home');
              } else if (state is OrderActive && state.order.driverId != null) {
                ctx.read<TrackingBloc>().add(
                      TrackingStarted(
                        orderId: state.order.id,
                        driverId: state.order.driverId!,
                      ),
                    );
              } else {
                ctx.read<TrackingBloc>().add(const TrackingStopped());
              }
            },
          ),
          // تنبيه قسري عند وصول السائق: اهتزاز قوي + نغمة (B2).
          BlocListener<OrderBloc, OrderState>(
            listenWhen: (p, c) {
              final pS = p is OrderActive ? p.order.status : null;
              final cS = c is OrderActive ? c.order.status : null;
              return cS == OrderStatus.arrived && pS != OrderStatus.arrived;
            },
            listener: (_, __) {
              Haptics.heavy();
              SystemSound.play(SystemSoundType.alert);
            },
          ),
          // انسياب علامة السيارة عند كل تحديث موقع
          BlocListener<TrackingBloc, TrackingState>(
            listenWhen: (p, c) => c is TrackingActive && c.lastLocation != null,
            listener: (ctx, state) {
              if (state is TrackingActive && state.lastLocation != null) {
                _moveCarTo(state.lastLocation!);
              }
            },
          ),
        ],
        child: _buildContent(),
      ),
    );
  }

  Widget _buildContent() {
    return BlocBuilder<OrderBloc, OrderState>(
      builder: (ctx, state) {
        final order = state is OrderActive
            ? state.order
            : state is OrderCreated
                ? state.order
                : null;

        if (order == null) {
          return Scaffold(
            backgroundColor: AuroraColors.obsidian,
            body: const Center(child: AuroraLoader(size: 40)),
          );
        }

        return Scaffold(
          backgroundColor: AuroraColors.obsidian,
          body: Stack(
            children: [
              // ─── Map ───
              _buildMap(order),

              // ─── Top bar ───
              Positioned(
                top: MediaQuery.of(context).padding.top + AuroraSpacing.md,
                left: AuroraSpacing.lg,
                right: AuroraSpacing.lg,
                child: _buildTopBar(ctx, order),
              ),

              // ─── Recenter (fit bounds) ───
              Positioned(
                right: AuroraSpacing.lg,
                bottom: 300,
                child: FloatingActionButton.small(
                  heroTag: 'recenter',
                  backgroundColor: AuroraColors.coal,
                  onPressed: _fitBounds,
                  child: Icon(Icons.center_focus_strong,
                      color: AuroraColors.ember),
                ),
              ),

              // ─── Bottom tracking card ───
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: _buildBottomCard(order),
              ),
            ],
          ),
        );
      },
    );
  }

  // ─────────────────────────────────────────────────────────────
  Widget _buildMap(OrderModel order) {
    return BlocBuilder<TrackingBloc, TrackingState>(
      builder: (ctx, trackState) {
        final driverLoc =
            trackState is TrackingActive ? trackState.lastLocation : null;
        return _buildMapWithDriver(order, driverLoc);
      },
    );
  }

  Widget _buildMapWithDriver(OrderModel order, DriverLocation? driverLoc) {
    _lastOrder = order;
    _lastDriverLoc = driverLoc;
    final markers = <Marker>{};

    if (order.points.isNotEmpty) {
      markers.add(Marker(
        markerId: const MarkerId('origin'),
        position: LatLng(order.points.first.lat, order.points.first.lng),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
      ));
    }
    if (order.points.length > 1) {
      markers.add(Marker(
        markerId: const MarkerId('destination'),
        position: LatLng(order.points.last.lat, order.points.last.lng),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
      ));
    }
    if (driverLoc != null) {
      // الموضع المُنعّم (من المُنزلِق) مع احتياط لموقع GPS الخام
      final pos = _carPos ?? LatLng(driverLoc.lat, driverLoc.lng);
      final bearing =
          _carPos != null ? _carBearing : driverLoc.heading.toDouble();
      markers.add(Marker(
        markerId: const MarkerId('driver'),
        position: pos,
        rotation: bearing,
        anchor: const Offset(0.5, 0.5),
        flat: true,
        icon: _carIcon ??
            BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueYellow),
        infoWindow: InfoWindow(title: tr('driver')),
      ));
    }

    final centerLat = driverLoc?.lat ??
        (order.points.isNotEmpty ? order.points.first.lat : 24.7136);
    final centerLng = driverLoc?.lng ??
        (order.points.isNotEmpty ? order.points.first.lng : 46.6753);

    return GoogleMap(
      style: _darkMapStyle,
      onMapCreated: (c) {
        _mapCtrl = c;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _fitBounds();
          // المسار الفعلي (يتبع الشوارع) إن توفّر، وإلا نقاط البداية/النهاية.
          if (order.routeLine.length > 1) {
            _revealRoute(
                order.routeLine.map((p) => LatLng(p.lat, p.lng)).toList());
          }
        });
      },
      initialCameraPosition: CameraPosition(
        target: LatLng(centerLat, centerLng),
        zoom: 14,
      ),
      markers: markers,
      polylines: order.routeLine.length > 1
          ? {
              Polyline(
                polylineId: const PolylineId('route'),
                color: AuroraColors.ember,
                width: 5,
                patterns: const [],
                points: _routeReveal ??
                    order.routeLine.map((p) => LatLng(p.lat, p.lng)).toList(),
              ),
            }
          : <Polyline>{},
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      compassEnabled: false,
    );
  }

  // ─────────────────────────────────────────────────────────────
  Widget _buildTopBar(BuildContext ctx, OrderModel order) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Close button
        _circleBtn(
          icon: Icons.close,
          onTap: () => _confirmCancel(ctx, order),
        ),

        // Status pill
        _statusPill(order),

        // SOS compact
        if (order.status.hasDriver)
          AuroraSosCompactButton(
            latitude: order.points.isNotEmpty ? order.points.first.lat : 0,
            longitude: order.points.isNotEmpty ? order.points.first.lng : 0,
            orderId: order.id,
          )
        else
          const SizedBox(width: 44),
      ],
    );
  }

  Widget _circleBtn({required IconData icon, required VoidCallback onTap}) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AuroraColors.ash.withValues(alpha: 0.9),
        shape: BoxShape.circle,
        border: Border.all(color: AuroraColors.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x66000000),
            blurRadius: 16,
            offset: Offset(0, 4),
          ),
        ],
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

  Widget _statusPill(OrderModel order) {
    String text;
    Color color;
    if (order.status == OrderStatus.notFound) {
      text = tr('noDriversTitle');
      color = AuroraColors.danger;
    } else if (order.status == OrderStatus.requested ||
        order.status == OrderStatus.found) {
      text = tr('searchingDriver');
      color = AuroraColors.ember;
    } else if (order.status == OrderStatus.driverAccepted) {
      text = tr('driverOnWay');
      color = AuroraColors.ember;
    } else if (order.status == OrderStatus.arrived) {
      text = tr('driverArrived');
      color = AuroraColors.success;
    } else if (order.status == OrderStatus.started) {
      text = tr('inRide');
      color = AuroraColors.info;
    } else {
      text = tr('inProgress');
      color = AuroraColors.textSecondary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
      decoration: BoxDecoration(
        color: AuroraColors.ash.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(AuroraRadius.pill),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: color, blurRadius: 6, spreadRadius: 1),
              ],
            ),
          ),
          const SizedBox(width: AuroraSpacing.sm),
          Text(
            text,
            style: AuroraText.bodySmall.copyWith(
              color: AuroraColors.pearl,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  Widget _buildBottomCard(OrderModel order) {
    final hasDriver = order.driverId != null;
    return Container(
      decoration: BoxDecoration(
        color: AuroraColors.obsidian,
        borderRadius:
            const BorderRadius.vertical(top: Radius.circular(AuroraRadius.xl)),
        boxShadow: AuroraShadows.floatingNav,
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(AuroraSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Container(
                width: 48,
                height: 4,
                decoration: BoxDecoration(
                  color: AuroraColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: AuroraSpacing.lg),

              if (order.status == OrderStatus.notFound)
                _noDriverFoundCard()
              else if (!hasDriver)
                _searchingDriverCard(order)
              else if (order.status == OrderStatus.arrived)
                AuroraArrivedPanel(order: order)
              else
                _driverInfoRow(order),

              // كود التسليم للأمانات
              if ((order.otpCode ?? '').isNotEmpty &&
                  (order.receiverPhone ?? '').isNotEmpty) ...[
                const SizedBox(height: AuroraSpacing.lg),
                _deliveryCodeCard(order),
              ],

              const SizedBox(height: AuroraSpacing.lg),

              // ETA + fare
              _etaFareRow(order),

              // رسوم الانتظار (إن تراكمت) — تربط حساب B2 بواجهة الراكب.
              if (order.waitCost > 0) ...[
                const SizedBox(height: AuroraSpacing.sm),
                _waitCostChip(order),
              ],

              if (hasDriver) ...[
                const SizedBox(height: AuroraSpacing.md),
                _moodsShieldRow(order),
                const SizedBox(height: AuroraSpacing.lg),

                // Actions
                Builder(builder: (rowCtx) {
                  return Row(
                    children: [
                      Expanded(
                        child: _action(
                          icon: Icons.phone,
                          label: tr('call'),
                          onTap: () =>
                              launchPhoneCall(rowCtx, order.driverPhone),
                        ),
                      ),
                      const SizedBox(width: AuroraSpacing.sm),
                      Expanded(
                        child: _action(
                          icon: Icons.chat_bubble_outline,
                          label: tr('message'),
                          onTap: () => Navigator.of(rowCtx).push(
                            MaterialPageRoute(
                              builder: (_) => AuroraChatScreen(
                                orderId: order.id,
                                driverName: order.driverName,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: AuroraSpacing.sm),
                      Expanded(
                        child: _action(
                          icon: Icons.share_outlined,
                          label: tr('share'),
                          onTap: () => _shareTrip(order),
                        ),
                      ),
                    ],
                  );
                }),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _searchingDriverCard(OrderModel order) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
          horizontal: AuroraSpacing.lg, vertical: AuroraSpacing.lg),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(color: AuroraColors.ember.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          const AuroraRadarBeacon(size: 78),
          const SizedBox(height: AuroraSpacing.md),
          Text(tr('searchingDriverTitle'), style: AuroraText.titleSmall),
          const SizedBox(height: 4),
          Text(
            tr('notifyingNearbyDrivers'),
            textAlign: TextAlign.center,
            style: AuroraText.bodySmall
                .copyWith(color: AuroraColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _noDriverFoundCard() {
    return _statusCard(
      icon: Icons.search_off_outlined,
      title: tr('noDriversTitle'),
      body: tr('noDriversBody'),
      accent: AuroraColors.danger,
      trailing: TextButton(
        onPressed: () => context.go('/home'),
        child: Text(
          tr('backHome'),
          style: AuroraText.bodySmall.copyWith(color: AuroraColors.ember),
        ),
      ),
    );
  }

  Widget _statusCard({
    required IconData icon,
    required String title,
    required String body,
    required Color accent,
    Widget? trailing,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(color: accent.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(AuroraRadius.md),
            ),
            child: Icon(icon, color: accent),
          ),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AuroraText.titleSmall),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: AuroraText.bodySmall
                      .copyWith(color: AuroraColors.textSecondary),
                ),
              ],
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: AuroraSpacing.sm),
            trailing,
          ],
        ],
      ),
    );
  }

  Widget _deliveryCodeCard(OrderModel order) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.ember.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(color: AuroraColors.ember.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Icon(Icons.lock_outline, color: AuroraColors.ember),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr('deliveryCode'),
                    style: AuroraText.bodySmall
                        .copyWith(color: AuroraColors.textSecondary)),
                const SizedBox(height: 2),
                Text(
                  order.otpCode ?? '',
                  style: AuroraText.titleLarge.copyWith(
                    color: AuroraColors.ember,
                    letterSpacing: 6,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(tr('deliveryCodeHint'),
                    style: AuroraText.bodySmall
                        .copyWith(color: AuroraColors.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _driverInfoRow(OrderModel order) {
    final name = order.driverName ?? tr('driver');
    final rating = order.driverRating?.toStringAsFixed(1) ?? '—';
    final car =
        [order.carBrand, order.carModel].where((s) => s != null).join(' ');
    final plate = order.plateNumber ?? '';

    return Row(
      children: [
        // Avatar
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AuroraRadius.md),
            gradient: AuroraColors.emberGradient,
            boxShadow: AuroraShadows.iconGlow,
          ),
          child: Center(
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : '?',
              style: AuroraText.titleLarge.copyWith(color: AuroraColors.pearl),
            ),
          ),
        ),
        const SizedBox(width: AuroraSpacing.md),
        // Name + rating + car
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(
                      name,
                      style: AuroraText.titleSmall,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: AuroraSpacing.xs),
                  Icon(Icons.star, color: AuroraColors.gold, size: 14),
                  const SizedBox(width: 2),
                  Text(
                    rating,
                    style: AuroraText.bodySmall.copyWith(
                      color: AuroraColors.gold,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              if (car.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(car, style: AuroraText.bodySmall),
              ],
            ],
          ),
        ),
        // Plate
        if (plate.isNotEmpty)
          Container(
            padding: const EdgeInsets.symmetric(
                horizontal: AuroraSpacing.md, vertical: 6),
            decoration: BoxDecoration(
              color: AuroraColors.pearl,
              borderRadius: BorderRadius.circular(AuroraRadius.sm),
              border: Border.all(color: AuroraColors.border, width: 1.5),
            ),
            child: Text(
              plate,
              style: AuroraText.titleSmall.copyWith(
                color: AuroraColors.obsidian,
                fontWeight: FontWeight.w800,
                fontSize: 14,
                letterSpacing: 1.5,
              ),
            ),
          ),
      ],
    );
  }

  Widget _etaFareRow(OrderModel order) {
    final fmt = NumberFormat('#,##0.00', 'ar');
    final eta = order.etaPickup;
    String etaText = '—';
    if (eta != null) {
      final mins = eta.difference(DateTime.now()).inMinutes;
      if (mins > 0) {
        etaText = '$mins د';
      } else {
        etaText = tr('arrivedShort');
      }
    }

    return Row(
      children: [
        Expanded(
          child: AuroraCard(
            padding: const EdgeInsets.all(AuroraSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr('eta'), style: AuroraText.caption),
                const SizedBox(height: 2),
                Text(
                  etaText,
                  style: AuroraText.titleMedium.copyWith(
                    color: AuroraColors.ember,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: AuroraSpacing.sm),
        Expanded(
          child: AuroraCard(
            padding: const EdgeInsets.all(AuroraSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr('fare'), style: AuroraText.caption),
                const SizedBox(height: 2),
                Text(
                  '${fmt.format(order.costAfterCoupon)} ${order.currency}',
                  style: AuroraText.titleMedium.copyWith(
                    color: AuroraColors.pearl,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  /// شريط HANCR Shield + استرجاع الأمزجة المختارة (Phase F).
  Widget _moodsShieldRow(OrderModel order) {
    final chips = <Widget>[
      _miniChip(Icons.verified_user_rounded, tr('rideInsured'),
          AuroraColors.success),
      if (order.quietRide)
        _miniChip(Icons.volume_off_rounded, tr('moodQuiet'), AuroraColors.ember),
      if (order.audioOff)
        _miniChip(
            Icons.music_off_rounded, tr('moodNoAudio'), AuroraColors.ember),
      if (order.numberMasked)
        _miniChip(
            Icons.phone_locked_rounded, tr('moodMasked'), AuroraColors.ember),
    ];
    return Align(
      alignment: AlignmentDirectional.centerStart,
      child: Wrap(
        spacing: AuroraSpacing.sm,
        runSpacing: AuroraSpacing.sm,
        children: chips,
      ),
    );
  }

  Widget _miniChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AuroraRadius.pill),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 5),
          Text(label,
              style: AuroraText.caption
                  .copyWith(color: color, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _waitCostChip(OrderModel order) {
    final fmt = NumberFormat('#,##0.00', 'ar');
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
          horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
      decoration: BoxDecoration(
        color: AuroraColors.warningBg,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.warning.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Icon(Icons.timer_outlined, size: 18, color: AuroraColors.warning),
          const SizedBox(width: AuroraSpacing.sm),
          Expanded(
            child: Text(tr('waitTimeFee'),
                style: AuroraText.bodySmall
                    .copyWith(color: AuroraColors.textPrimary)),
          ),
          Text(
            '${fmt.format(order.waitCost)} ${order.currency}',
            style: AuroraText.titleSmall.copyWith(color: AuroraColors.warning),
          ),
        ],
      ),
    );
  }

  Widget _action({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AuroraSpacing.md),
          decoration: BoxDecoration(
            color: AuroraColors.ash,
            borderRadius: BorderRadius.circular(AuroraRadius.md),
            border: Border.all(color: AuroraColors.border),
          ),
          child: Column(
            children: [
              Icon(icon, color: AuroraColors.ember, size: 22),
              const SizedBox(height: 4),
              Text(
                label,
                style: AuroraText.caption.copyWith(
                  color: AuroraColors.pearl,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  /// ورقة سبب الإلغاء (Phase E) — تعرض الأسباب + تحذير الرسم عند إسناد السائق.
  Future<void> _confirmCancel(BuildContext ctx, OrderModel order) async {
    final bloc = ctx.read<OrderBloc>();
    final feeApplies = order.status.hasDriver;
    final reason =
        await CancelReasonSheet.show(ctx, feeApplies: feeApplies);
    // null = تراجع (متابعة الرحلة)؛ غير ذلك = تأكيد الإلغاء (قد يكون السبب '').
    if (reason == null) return;
    bloc.add(OrderCancelRequested(
      order.id,
      reason: reason.isEmpty ? null : reason,
    ));
  }
}
