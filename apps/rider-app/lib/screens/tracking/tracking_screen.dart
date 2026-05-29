import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_event.dart';
import '../../blocs/order/order_state.dart';
import '../../blocs/sos/sos_bloc.dart';
import '../../blocs/sos/sos_event.dart';
import '../../blocs/sos/sos_state.dart';
import '../../blocs/tracking/tracking_bloc.dart';
import '../../core/models/order_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';
import '../sos/emergency_contacts_screen.dart';

/// TrackingScreen — تتبُّع الرحلة الحيّة بالتصميم الجديد
///
/// التحسينات:
/// - Driver card كبير مع photo + ring violet للتحقق
/// - Quick actions صف من 4 أزرار (Call/Message/SOS/Share)
/// - Status pill متحرّك مع dot نابض
/// - Fare summary واضح
/// - SOS overlay بزر أحمر بارز
class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  GoogleMapController? _mapCtrl;

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<SosBloc>(
          create: (_) => SosBloc()..add(const SosLoadRequested()),
        ),
        BlocProvider<TrackingBloc>(
          create: (_) => TrackingBloc(),
        ),
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
                    backgroundColor: HancrColors.error,
                  ),
                );
                ctx.read<SosBloc>().add(const SosToastCleared());
              }
            },
          ),
          BlocListener<OrderBloc, OrderState>(
            // ابدأ التتبع تلقائياً عند ظهور driverId
            listenWhen: (p, c) {
              final pDrv = p is OrderActive ? p.order.driverId : null;
              final cDrv = c is OrderActive ? c.order.driverId : null;
              return pDrv != cDrv;
            },
            listener: (ctx, state) {
              if (state is OrderActive && state.order.driverId != null) {
                ctx
                    .read<TrackingBloc>()
                    .add(TrackingStarted(state.order.driverId!));
              } else {
                ctx.read<TrackingBloc>().add(const TrackingStopped());
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
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(color: HancrColors.violet),
            ),
          );
        }

        return Scaffold(
          body: Stack(
            children: [
              // ─── Map ───
              _buildMap(order),

              // ─── Top bar ───
              Positioned(
                top: MediaQuery.of(context).padding.top + HancrSpacing.md,
                left: HancrSpacing.lg,
                right: HancrSpacing.lg,
                child: Row(
                  children: [
                    HancrIconButton(
                      icon: Icons.close_rounded,
                      onPressed: () => _confirmCancel(ctx, order.id),
                      shadow: true,
                    ),
                    const Spacer(),
                    // SOS button — always visible during trip
                    if (order.status.hasDriver)
                      _SOSButton(onPressed: () => _showSOS(ctx, order)),
                  ],
                ),
              ),

              // ─── Bottom tracking card ───
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: _TrackingCard(
                  order: order,
                  onCall: () {},
                  onMessage: () {},
                  onShare: () => _shareTrip(ctx),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMap(OrderModel order) {
    return BlocBuilder<TrackingBloc, TrackingState>(
      builder: (ctx, trackState) {
        final driverLoc = trackState is TrackingActive
            ? trackState.lastLocation
            : null;
        return _buildMapWithDriver(order, driverLoc);
      },
    );
  }

  Widget _buildMapWithDriver(OrderModel order, DriverLocation? driverLoc) {
    final markers = <Marker>{};

    if (order.points.isNotEmpty) {
      markers.add(Marker(
        markerId: const MarkerId('origin'),
        position: LatLng(order.points.first.lat, order.points.first.lng),
        icon: BitmapDescriptor.defaultMarkerWithHue(
          BitmapDescriptor.hueAzure,
        ),
      ));
    }

    if (order.points.length > 1) {
      markers.add(Marker(
        markerId: const MarkerId('destination'),
        position: LatLng(order.points.last.lat, order.points.last.lng),
        icon: BitmapDescriptor.defaultMarkerWithHue(
          BitmapDescriptor.hueViolet,
        ),
      ));
    }

    // ─── Driver marker (live) ───
    if (driverLoc != null) {
      markers.add(Marker(
        markerId: const MarkerId('driver'),
        position: LatLng(driverLoc.lat, driverLoc.lng),
        rotation: driverLoc.heading.toDouble(),
        anchor: const Offset(0.5, 0.5),
        flat: true,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        infoWindow: const InfoWindow(title: 'السائق'),
      ));
    }

    final centerLat =
        order.points.isNotEmpty ? order.points.first.lat : 24.7136;
    final centerLng =
        order.points.isNotEmpty ? order.points.first.lng : 46.6753;

    return GoogleMap(
      onMapCreated: (ctrl) => _mapCtrl = ctrl,
      initialCameraPosition: CameraPosition(
        target: LatLng(centerLat, centerLng),
        zoom: 14,
      ),
      markers: markers,
      polylines: order.points.length > 1
          ? {
              Polyline(
                polylineId: const PolylineId('route'),
                color: HancrColors.violet,
                width: 5,
                points: order.points
                    .map((p) => LatLng(p.lat, p.lng))
                    .toList(),
              ),
            }
          : {},
      zoomControlsEnabled: false,
      mapToolbarEnabled: false,
      myLocationButtonEnabled: false,
    );
  }

  void _confirmCancel(BuildContext ctx, int orderId) {
    showDialog<bool>(
      context: ctx,
      builder: (_) => AlertDialog(
        icon: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: HancrColors.warningBg,
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.warning_amber_rounded,
            color: HancrColors.warning,
            size: 28,
          ),
        ),
        title: const Text('إلغاء الرحلة؟'),
        content: const Text(
          'قد تُطبَّق رسوم إلغاء حسب وقت الإلغاء وحالة السائق.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('الإبقاء على الرحلة'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: HancrColors.error),
            child: const Text('إلغاء الرحلة'),
          ),
        ],
      ),
    ).then((confirmed) {
      if (confirmed == true && mounted) {
        ctx.read<OrderBloc>().add(OrderCancelRequested(orderId));
      }
    });
  }

  void _shareTrip(BuildContext ctx) {
    ScaffoldMessenger.of(ctx).showSnackBar(
      const SnackBar(
        content: Text('🔗 تم نسخ رابط مشاركة الرحلة'),
        backgroundColor: HancrColors.violet,
      ),
    );
  }

  void _showSOS(BuildContext ctx, OrderModel order) {
    // الموقع: نستخدم نقطة الالتقاط كحدّ أدنى. مستقبلاً: GPS الفعلي للجوال.
    final lat = order.points.isNotEmpty ? order.points.first.lat : 0.0;
    final lng = order.points.isNotEmpty ? order.points.first.lng : 0.0;
    final sosBloc = ctx.read<SosBloc>();
    showModalBottomSheet<void>(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BlocProvider.value(
        value: sosBloc,
        child: _SOSSheet(
          orderId: order.id,
          latitude: lat,
          longitude: lng,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SOS Button
// ─────────────────────────────────────────────────────────────────────────────

class _SOSButton extends StatefulWidget {
  const _SOSButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  State<_SOSButton> createState() => _SOSButtonState();
}

class _SOSButtonState extends State<_SOSButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) {
        return Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: HancrColors.error.withValues(
                  alpha: 0.6 * (1 - _ctrl.value),
                ),
                blurRadius: 8 + (16 * _ctrl.value),
                spreadRadius: 4 * _ctrl.value,
              ),
            ],
          ),
          child: Material(
            color: HancrColors.error,
            shape: const CircleBorder(),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: widget.onPressed,
              child: const SizedBox(
                width: 48,
                height: 48,
                child: Center(
                  child: Text(
                    'SOS',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SOS Bottom Sheet
// ─────────────────────────────────────────────────────────────────────────────

class _SOSSheet extends StatelessWidget {
  final int orderId;
  final double latitude;
  final double longitude;

  const _SOSSheet({
    required this.orderId,
    required this.latitude,
    required this.longitude,
  });

  Future<void> _triggerSos(BuildContext context) async {
    final sosBloc = context.read<SosBloc>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: const [
            Icon(Icons.warning_amber_rounded, color: HancrColors.error),
            SizedBox(width: 8),
            Text('تأكيد تفعيل الطوارئ'),
          ],
        ),
        content: const Text(
          'سيُرسَل موقعك ورقم الرحلة وتفاصيل السيارة لكل جهات الطوارئ المسجَّلة.\n\nلا تفعِّل هذا الزر إلا في حالات الخطر الحقيقي.',
          style: TextStyle(height: 1.6),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: HancrColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('نعم، فعِّل الآن'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      sosBloc.add(SosTriggered(
        latitude: latitude,
        longitude: longitude,
        orderId: orderId,
      ));
      if (context.mounted) Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(HancrSpacing.lg),
      padding: const EdgeInsets.all(HancrSpacing.xl),
      decoration: BoxDecoration(
        color: HancrColors.surface,
        borderRadius: BorderRadius.circular(HancrRadius.xxl),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: HancrColors.errorBg,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.shield_rounded,
                color: HancrColors.error,
                size: 32,
              ),
            ),
            const SizedBox(height: HancrSpacing.md),
            const Text(
              'مركز الطوارئ',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: HancrColors.textPrimary,
              ),
            ),
            const SizedBox(height: HancrSpacing.xs),
            const Text(
              'هل أنت بأمان؟ اختر الإجراء المناسب',
              style: TextStyle(
                fontSize: 13,
                color: HancrColors.textSecondary,
              ),
            ),
            const SizedBox(height: HancrSpacing.xl),
            BlocBuilder<SosBloc, SosState>(
              builder: (ctx, state) {
                final hasActive =
                    state is SosLoaded && state.activeIncident != null;
                if (hasActive) {
                  // عرض حالة الحادثة + زر الإلغاء
                  final inc = state.activeIncident!;
                  return Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(HancrSpacing.md),
                        decoration: BoxDecoration(
                          color: HancrColors.errorBg,
                          borderRadius: BorderRadius.circular(HancrRadius.md),
                        ),
                        child: Column(
                          children: [
                            const Text(
                              '🚨 طوارئ نشطة',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: HancrColors.error,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'تم إشعار ${inc.contactsNotified} جهة طوارئ',
                              style: const TextStyle(
                                fontSize: 12,
                                color: HancrColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: HancrSpacing.sm),
                      HancrButton.outline(
                        label: 'إنذار خاطئ — إلغاء',
                        icon: Icons.cancel_outlined,
                        onPressed: () {
                          ctx
                              .read<SosBloc>()
                              .add(SosCancelled(inc.id));
                          Navigator.of(context).pop();
                        },
                      ),
                    ],
                  );
                }
                return Column(
                  children: [
                    HancrButton.danger(
                      label: '🚨 تفعيل الطوارئ',
                      icon: Icons.warning_amber_rounded,
                      onPressed: () => _triggerSos(context),
                    ),
                    const SizedBox(height: HancrSpacing.sm),
                    HancrButton.secondary(
                      label: 'شارك موقعي مع جهات الطوارئ',
                      icon: Icons.share_location_rounded,
                      onPressed: () => _triggerSos(context),
                    ),
                    const SizedBox(height: HancrSpacing.sm),
                    HancrButton.outline(
                      label: 'إدارة جهات الطوارئ',
                      icon: Icons.contact_phone_outlined,
                      onPressed: () {
                        Navigator.of(context).pop();
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) =>
                                const EmergencyContactsScreen(),
                          ),
                        );
                      },
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: HancrSpacing.lg),
            Container(
              padding: const EdgeInsets.all(HancrSpacing.md),
              decoration: BoxDecoration(
                color: HancrColors.violetLight.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(HancrRadius.md),
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      color: HancrColors.violet,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.support_agent_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: HancrSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'مسؤولك الشخصي',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: HancrColors.textSecondary,
                          ),
                        ),
                        Text(
                          'محمد العتيبي — يرد خلال 3 دقائق',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: HancrColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: HancrSpacing.lg),
            TextButton(
              onPressed: () => Navigator.maybePop(context),
              child: const Text('أنا بأمان — إغلاق'),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tracking Card
// ─────────────────────────────────────────────────────────────────────────────

class _TrackingCard extends StatelessWidget {
  const _TrackingCard({
    required this.order,
    required this.onCall,
    required this.onMessage,
    required this.onShare,
  });

  final OrderModel order;
  final VoidCallback onCall;
  final VoidCallback onMessage;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: HancrColors.surface,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(HancrRadius.xxl),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 24,
            offset: Offset(0, -8),
          ),
        ],
      ),
      padding: EdgeInsets.fromLTRB(
        HancrSpacing.lg,
        HancrSpacing.md,
        HancrSpacing.lg,
        HancrSpacing.lg + MediaQuery.of(context).padding.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: HancrColors.borderStrong,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: HancrSpacing.md),

          // Status pill
          Row(
            children: [
              _StatusPill(status: order.status),
              const Spacer(),
              if (order.etaPickup != null)
                Row(
                  children: [
                    const Icon(
                      Icons.access_time_rounded,
                      size: 14,
                      color: HancrColors.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      DateFormat.jm().format(order.etaPickup!.toLocal()),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: HancrColors.textPrimary,
                      ),
                    ),
                  ],
                ),
            ],
          ),
          const SizedBox(height: HancrSpacing.lg),

          // Driver card
          if (order.status.hasDriver && order.driverName != null) ...[
            Container(
              padding: const EdgeInsets.all(HancrSpacing.md),
              decoration: BoxDecoration(
                color: HancrColors.surfaceMute,
                borderRadius: BorderRadius.circular(HancrRadius.lg),
              ),
              child: Row(
                children: [
                  // Driver photo with violet ring
                  Container(
                    padding: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: HancrColors.violetGradient,
                    ),
                    child: Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: HancrColors.navy,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: Center(
                        child: Text(
                          order.driverName![0].toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: HancrSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                order.driverName!,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: HancrColors.textPrimary,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(
                              Icons.verified_rounded,
                              size: 14,
                              color: HancrColors.violet,
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          [
                            if (order.carBrand != null) order.carBrand!,
                            if (order.carModel != null) order.carModel!,
                            if (order.carColor != null) '• ${order.carColor}',
                          ].join(' '),
                          style: const TextStyle(
                            fontSize: 12,
                            color: HancrColors.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (order.plateNumber != null) ...[
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: HancrColors.borderStrong,
                              ),
                            ),
                            child: Text(
                              order.plateNumber!,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: HancrColors.textPrimary,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  // Rating
                  if (order.driverRating != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: HancrSpacing.sm,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(HancrRadius.sm),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.star_rounded,
                            color: Color(0xFFD97706),
                            size: 14,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            order.driverRating!.toStringAsFixed(1),
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF92400E),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: HancrSpacing.md),

            // Quick actions row
            Row(
              children: [
                Expanded(
                  child: _QuickAction(
                    icon: Icons.phone_rounded,
                    label: 'اتصال',
                    onTap: order.driverPhone != null && !order.numberMasked
                        ? onCall
                        : null,
                  ),
                ),
                const SizedBox(width: HancrSpacing.sm),
                Expanded(
                  child: _QuickAction(
                    icon: Icons.message_rounded,
                    label: 'رسالة',
                    onTap: onMessage,
                  ),
                ),
                const SizedBox(width: HancrSpacing.sm),
                Expanded(
                  child: _QuickAction(
                    icon: Icons.share_location_rounded,
                    label: 'مشاركة',
                    onTap: onShare,
                  ),
                ),
              ],
            ),
            const SizedBox(height: HancrSpacing.md),
          ],

          // Trip details
          Container(
            padding: const EdgeInsets.all(HancrSpacing.md),
            decoration: BoxDecoration(
              color: HancrColors.violetLight.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(HancrRadius.md),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_rounded,
                      size: 16,
                      color: HancrColors.violet,
                    ),
                    const SizedBox(width: HancrSpacing.sm),
                    Expanded(
                      child: Text(
                        order.destinationAddress,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: HancrColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const Divider(height: HancrSpacing.lg, color: Colors.white),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'السعر المتوقَّع',
                      style: TextStyle(
                        fontSize: 12,
                        color: HancrColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      '${order.costAfterCoupon.toStringAsFixed(0)} ${order.currency}',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: HancrColors.violetDeep,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Pill (with pulsing dot)
// ─────────────────────────────────────────────────────────────────────────────

class _StatusPill extends StatefulWidget {
  const _StatusPill({required this.status});
  final OrderStatus status;

  @override
  State<_StatusPill> createState() => _StatusPillState();
}

class _StatusPillState extends State<_StatusPill>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Color get _color {
    switch (widget.status) {
      case OrderStatus.requested:
      case OrderStatus.notFound:
        return HancrColors.warning;
      case OrderStatus.found:
      case OrderStatus.driverAccepted:
        return HancrColors.info;
      case OrderStatus.arrived:
      case OrderStatus.started:
        return HancrColors.success;
      case OrderStatus.waitingForPostPay:
      case OrderStatus.waitingForReview:
        return HancrColors.violet;
      default:
        return HancrColors.textSecondary;
    }
  }

  String get _label {
    switch (widget.status) {
      case OrderStatus.requested:
        return 'جارٍ البحث عن سائق';
      case OrderStatus.notFound:
        return 'لا يوجد سائقون متاحون';
      case OrderStatus.found:
        return 'تم العثور على سائق';
      case OrderStatus.driverAccepted:
        return 'السائق في الطريق';
      case OrderStatus.arrived:
        return 'السائق وصل';
      case OrderStatus.started:
        return 'الرحلة جارية';
      case OrderStatus.waitingForPostPay:
        return 'بانتظار الدفع';
      case OrderStatus.waitingForReview:
        return 'قيّم رحلتك';
      default:
        return widget.status.label;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: HancrSpacing.md,
        vertical: HancrSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(HancrRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedBuilder(
            animation: _ctrl,
            builder: (_, __) {
              return Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: _color.withValues(alpha: 0.5 + 0.5 * _ctrl.value),
                  shape: BoxShape.circle,
                ),
              );
            },
          ),
          const SizedBox(width: HancrSpacing.sm),
          Text(
            _label,
            style: TextStyle(
              color: _color,
              fontWeight: FontWeight.w800,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Action Tile
// ─────────────────────────────────────────────────────────────────────────────

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final disabled = onTap == null;
    return Material(
      color: disabled
          ? HancrColors.surfaceMute
          : HancrColors.violetLight.withValues(alpha: 0.4),
      borderRadius: BorderRadius.circular(HancrRadius.md),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: HancrSpacing.md),
          child: Column(
            children: [
              Icon(
                icon,
                size: 22,
                color: disabled ? HancrColors.textHint : HancrColors.violetDeep,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: disabled
                      ? HancrColors.textHint
                      : HancrColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
