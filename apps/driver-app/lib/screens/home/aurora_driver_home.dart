import '../../core/i18n/app_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:intl/intl.dart';
import '../bids/driver_bids_screen.dart';
import '../chat/driver_chat_screen.dart';
import '../../core/utils/external_launch.dart';
import '../../blocs/location/location_bloc.dart';
import '../../blocs/location/location_event.dart';
import '../../blocs/location/location_state.dart';
import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_event.dart';
import '../../blocs/order/order_state.dart';
import '../../core/models/order_model.dart';
import '../../blocs/sos/sos_bloc.dart';
import '../../blocs/sos/sos_event.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/driver_gql.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../earnings/aurora_earnings_tab.dart';
import '../profile/aurora_driver_profile_tab.dart';
import '../sos/aurora_driver_sos_button.dart';
import '../stars/aurora_stars_tab.dart';

/// AuroraDriverHome — البديل الكامل لـ HomeScreen القديم.
class AuroraDriverHome extends StatefulWidget {
  const AuroraDriverHome({super.key});

  @override
  State<AuroraDriverHome> createState() => _AuroraDriverHomeState();
}

class _AuroraDriverHomeState extends State<AuroraDriverHome> {
  int _tab = 0;

  late final _tabs = const [
    _MapTab(),
    AuroraEarningsTab(),
    AuroraStarsTab(),
    AuroraDriverProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return BlocProvider<SosBloc>(
      create: (_) => SosBloc()..add(const SosLoadRequested()),
      child: Scaffold(
        backgroundColor: AuroraColors.obsidian,
        extendBody: true,
        body: IndexedStack(index: _tab, children: _tabs),
        bottomNavigationBar: _buildNav(),
      ),
    );
  }

  Widget _buildNav() {
    return Container(
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        border: Border(top: BorderSide(color: AuroraColors.border)),
        boxShadow: AuroraShadows.floatingNav,
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(
              horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _navItem(0, Icons.map_outlined, Icons.map, tr('nav_map')),
              _navItem(1, Icons.attach_money_outlined,
                  Icons.attach_money, tr('nav_earnings')),
              _navItem(2, Icons.star_outline, Icons.star, tr('nav_stars')),
              _navItem(3, Icons.person_outline, Icons.person, tr('nav_account')),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(int idx, IconData icon, IconData iconFilled, String label) {
    final selected = _tab == idx;
    return GestureDetector(
      onTap: () => setState(() => _tab = idx),
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              selected ? iconFilled : icon,
              color: selected ? AuroraColors.ember : AuroraColors.textSecondary,
              size: 24,
              shadows: selected ? AuroraShadows.iconGlow : null,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: AuroraText.caption.copyWith(
                color: selected ? AuroraColors.ember : AuroraColors.textSecondary,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// ─────────────────────────────────────────────────────────────
/// Map Tab — Online toggle + map + active ride card
/// ─────────────────────────────────────────────────────────────
class _MapTab extends StatelessWidget {
  const _MapTab();

  static const String _darkMapStyle = '''
[
  {"elementType":"geometry","stylers":[{"color":"#13100E"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#A89B96"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#0A0807"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#2A2421"}]},
  {"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#FF7A1A"},{"saturation":-50},{"lightness":-30}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#1F1A17"}]},
  {"featureType":"poi","elementType":"labels","stylers":[{"visibility":"off"}]}
]
''';

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // ─── Map ───
        BlocBuilder<LocationBloc, LocationState>(
          builder: (ctx, state) {
            final lat =
                state is LocationTracking ? state.lat : 24.7136;
            final lng =
                state is LocationTracking ? state.lng : 46.6753;
            return GoogleMap(
              style: _darkMapStyle,
              initialCameraPosition: CameraPosition(
                target: LatLng(lat, lng),
                zoom: 14,
              ),
              myLocationEnabled: true,
              myLocationButtonEnabled: false,
              zoomControlsEnabled: false,
              compassEnabled: false,
            );
          },
        ),

        // ─── Top bar ───
        Positioned(
          top: MediaQuery.of(context).padding.top + AuroraSpacing.md,
          left: AuroraSpacing.lg,
          right: AuroraSpacing.lg,
          child: const _DriverTopBar(),
        ),

        // ─── Bids access ───
        Positioned(
          top: MediaQuery.of(context).padding.top + 76,
          left: AuroraSpacing.lg,
          child: BlocBuilder<OrderBloc, OrderState>(
            builder: (ctx, state) {
              if (state is OrderActive) return const SizedBox.shrink();
              return GestureDetector(
                onTap: () => Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => const DriverBidsScreen())),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AuroraSpacing.md, vertical: 8),
                  decoration: BoxDecoration(
                    color: AuroraColors.ash,
                    borderRadius: BorderRadius.circular(AuroraRadius.pill),
                    border: Border.all(color: AuroraColors.border),
                    boxShadow: AuroraShadows.cardDepth,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.gavel,
                          color: AuroraColors.ember, size: 16),
                      const SizedBox(width: 6),
                      Text(tr('bids'),
                          style: TextStyle(
                              color: AuroraColors.pearl,
                              fontWeight: FontWeight.w700,
                              fontSize: 13)),
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        // ─── Online toggle CTA ───
        Positioned(
          bottom: 120,
          left: AuroraSpacing.lg,
          right: AuroraSpacing.lg,
          child: BlocBuilder<OrderBloc, OrderState>(
            builder: (ctx, state) {
              if (state is OrderActive) return const SizedBox.shrink();
              return const _OnlineToggle();
            },
          ),
        ),

        // ─── Active ride card (bottom) ───
        Positioned(
          bottom: 100,
          left: 0,
          right: 0,
          child: BlocBuilder<OrderBloc, OrderState>(
            builder: (ctx, state) {
              if (state is OrderActive) {
                return _ActiveRideCard(order: state.order);
              }
              return const SizedBox.shrink();
            },
          ),
        ),
      ],
    );
  }
}

/// Driver SOS + status pill في الأعلى
class _DriverTopBar extends StatelessWidget {
  const _DriverTopBar();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Avatar pill
        Container(
          padding: const EdgeInsets.symmetric(
              horizontal: 6, vertical: 6),
          decoration: BoxDecoration(
            color: AuroraColors.ash.withValues(alpha: 0.95),
            borderRadius: BorderRadius.circular(AuroraRadius.pill),
            border: Border.all(color: AuroraColors.border),
            boxShadow: const [
              BoxShadow(
                color: Color(0x66000000),
                blurRadius: 16,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  gradient: AuroraColors.emberGradient,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.person,
                    color: AuroraColors.pearl, size: 18),
              ),
              const SizedBox(width: AuroraSpacing.sm),
              BlocBuilder<LocationBloc, LocationState>(
                builder: (ctx, locState) {
                  final online = locState is LocationTracking;
                  return Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: online
                              ? AuroraColors.success
                              : AuroraColors.textHint,
                          shape: BoxShape.circle,
                          boxShadow: online
                              ? [
                                  BoxShadow(
                                    color: AuroraColors.success,
                                    blurRadius: 6,
                                    spreadRadius: 1,
                                  ),
                                ]
                              : null,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Text(
                          online ? tr('online') : tr('offline'),
                          style: AuroraText.bodySmall.copyWith(
                            color: AuroraColors.pearl,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),

        // SOS
        BlocBuilder<LocationBloc, LocationState>(
          builder: (ctx, state) {
            final lat = state is LocationTracking ? state.lat : 0.0;
            final lng = state is LocationTracking ? state.lng : 0.0;
            return BlocBuilder<OrderBloc, OrderState>(
              builder: (ctx2, orderState) {
                final orderId =
                    orderState is OrderActive ? orderState.order.id : null;
                return AuroraDriverSosButton(
                  latitude: lat,
                  longitude: lng,
                  orderId: orderId,
                );
              },
            );
          },
        ),
      ],
    );
  }
}

/// زر متصل / غير متصل (CTA كبير)
class _OnlineToggle extends StatefulWidget {
  const _OnlineToggle();

  @override
  State<_OnlineToggle> createState() => _OnlineToggleState();
}

class _OnlineToggleState extends State<_OnlineToggle>
    with SingleTickerProviderStateMixin {
  bool _busy = false;
  late final AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LocationBloc, LocationState>(
      builder: (ctx, locState) {
        final online = locState is LocationTracking;
        return GestureDetector(
          onTap: _busy ? null : () => _toggle(ctx, online),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(vertical: AuroraSpacing.lg),
            decoration: BoxDecoration(
              gradient: online
                  ? LinearGradient(
                      colors: [AuroraColors.success, Color(0xFF059669)],
                    )
                  : AuroraColors.emberGradient,
              borderRadius: BorderRadius.circular(AuroraRadius.xl),
              boxShadow: online
                  ? [
                      BoxShadow(
                        color: AuroraColors.success,
                        blurRadius: 24,
                        spreadRadius: -2,
                      ),
                    ]
                  : AuroraShadows.emberGlow,
            ),
            child: Column(
              children: [
                if (_busy)
                  SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AuroraColors.pearl,
                    ),
                  )
                else
                  Icon(
                    online
                        ? Icons.radio_button_checked
                        : Icons.power_settings_new,
                    color: AuroraColors.pearl,
                    size: 32,
                  ),
                const SizedBox(height: AuroraSpacing.sm),
                Text(
                  online ? tr('onlineReceiving') : tr('startReceiving'),
                  style: AuroraText.titleSmall.copyWith(
                    color: AuroraColors.pearl,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _toggle(BuildContext ctx, bool online) async {
    setState(() => _busy = true);
    final locBloc = ctx.read<LocationBloc>();
    final messenger = ScaffoldMessenger.of(ctx);
    try {
      final client = await GraphQLClientManager.get();
      if (online) {
        locBloc.add(const LocationStopTracking());
        await client.mutate(MutationOptions(document: gql(goOfflineMutation)));
        messenger.showSnackBar(SnackBar(
          content: Text(tr('youOffline'), style: AuroraText.bodyMedium),
          backgroundColor: AuroraColors.smoke,
        ));
      } else {
        await client.mutate(MutationOptions(document: gql(goOnlineMutation)));
        locBloc.add(const LocationStartTracking());
        messenger.showSnackBar(SnackBar(
          content: Text(tr('youOnline'), style: AuroraText.bodyMedium),
          backgroundColor: AuroraColors.success,
        ));
      }
    } catch (e) {
      messenger.showSnackBar(SnackBar(
        content: Text('خطأ: $e'),
        backgroundColor: AuroraColors.danger,
      ));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }
}

/// Active ride card (في الـ map)
class _ActiveRideCard extends StatefulWidget {
  final DriverOrderModel order;
  const _ActiveRideCard({required this.order});

  @override
  State<_ActiveRideCard> createState() => _ActiveRideCardState();
}

class _ActiveRideCardState extends State<_ActiveRideCard> {
  bool _busy = false;

  DriverOrderModel get order => widget.order;
  bool get _isDelivery =>
      order.type == 'ParcelDelivery' ||
      (order.receiverPhone ?? '').isNotEmpty;

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat('#,##0.00', 'ar');
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.circular(AuroraRadius.xl),
        border: Border.all(color: AuroraColors.borderGlow),
        boxShadow: AuroraShadows.emberGlow,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(AuroraSpacing.sm),
                decoration: BoxDecoration(
                  color: AuroraColors.ember.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                    _isDelivery ? Icons.local_shipping : Icons.local_taxi,
                    color: AuroraColors.ember,
                    size: 22),
              ),
              const SizedBox(width: AuroraSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _isDelivery ? tr('parcelDelivery') : tr('activeRide'),
                      style: AuroraText.titleSmall,
                    ),
                    Text(
                      '${fmt.format(order.costAfterCoupon)} ${order.currency}',
                      style: AuroraText.bodySmall.copyWith(
                        color: AuroraColors.ember,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(Icons.chat_bubble_outline,
                    color: AuroraColors.ember),
                tooltip: tr('chatWithRider'),
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => DriverChatScreen(
                      orderId: order.id,
                      riderName: order.riderName,
                    ),
                  ),
                ),
              ),
              _StatusChip(status: order.status),
            ],
          ),

          // بيانات المستلم للتوصيل
          if (_isDelivery && (order.receiverName ?? '').isNotEmpty) ...[
            const SizedBox(height: AuroraSpacing.md),
            Row(
              children: [
                const Icon(Icons.person_pin_circle,
                    size: 18, color: AuroraColors.textSecondary),
                const SizedBox(width: AuroraSpacing.sm),
                Expanded(
                  child: Text(
                    '${order.receiverName}'
                    '${(order.receiverPhone ?? '').isNotEmpty ? ' • ${order.receiverPhone}' : ''}',
                    style: AuroraText.bodySmall,
                  ),
                ),
              ],
            ),
          ],

          // الوجهة
          const SizedBox(height: AuroraSpacing.sm),
          Row(
            children: [
              Icon(Icons.location_on,
                  size: 18, color: AuroraColors.ember),
              const SizedBox(width: AuroraSpacing.sm),
              Expanded(
                child: Text(order.destinationAddress,
                    style: AuroraText.bodySmall,
                    overflow: TextOverflow.ellipsis),
              ),
            ],
          ),

          // اتصال + ملاحة (للوصول للراكب)
          const SizedBox(height: AuroraSpacing.md),
          Row(
            children: [
              Expanded(
                child: _miniAction(
                  icon: Icons.phone,
                  label: tr('callRider'),
                  onTap: () => launchPhoneCall(context, order.riderPhone),
                ),
              ),
              const SizedBox(width: AuroraSpacing.sm),
              Expanded(
                child: _miniAction(
                  icon: Icons.navigation,
                  label: tr('navigate'),
                  onTap: () {
                    final p = order.points.isNotEmpty ? order.points.first : null;
                    if (p != null) openExternalNav(context, p.lat, p.lng);
                  },
                ),
              ),
            ],
          ),

          const SizedBox(height: AuroraSpacing.lg),
          _buildAction(),

          if (order.status == OrderStatus.driverAccepted ||
              order.status == OrderStatus.arrived) ...[
            const SizedBox(height: AuroraSpacing.xs),
            TextButton(
              onPressed: _busy
                  ? null
                  : () => context
                      .read<OrderBloc>()
                      .add(OrderCancelRequested(order.id)),
              child: Text(tr('cancelRide'),
                  style: TextStyle(color: AuroraColors.danger)),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAction() {
    switch (order.status) {
      case OrderStatus.driverAccepted:
        return AuroraButton.primary(
          label: tr('arrivedPickup'),
          icon: Icons.my_location,
          onPressed: () => context
              .read<OrderBloc>()
              .add(OrderArrivedAtPickupRequested(order.id)),
        );
      case OrderStatus.arrived:
        return AuroraButton.primary(
          label: tr('startRide'),
          icon: Icons.play_arrow,
          onPressed: () => context
              .read<OrderBloc>()
              .add(OrderStartRideRequested(order.id)),
        );
      case OrderStatus.started:
        return AuroraButton.primary(
          label: _isDelivery ? tr('confirmDelivery') : tr('finishRide'),
          icon: _isDelivery ? Icons.verified : Icons.flag,
          loading: _busy,
          onPressed: _busy
              ? null
              : (_isDelivery
                  ? _openOtpDialog
                  : () => context
                      .read<OrderBloc>()
                      .add(OrderFinishRideRequested(order.id))),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _miniAction({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          border: Border.all(color: AuroraColors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: AuroraColors.ember),
            const SizedBox(width: 6),
            Text(label,
                style: AuroraText.bodySmall.copyWith(color: AuroraColors.pearl)),
          ],
        ),
      ),
    );
  }

  Future<void> _openOtpDialog() async {
    final ctrl = TextEditingController();
    final otp = await showDialog<String>(
      context: context,
      builder: (dctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('confirmDelivery'),
            style: AuroraText.titleSmall),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(tr('askReceiverCode'),
                style: AuroraText.bodySmall
                    .copyWith(color: AuroraColors.textSecondary)),
            const SizedBox(height: AuroraSpacing.md),
            TextField(
              controller: ctrl,
              keyboardType: TextInputType.number,
              maxLength: 4,
              textAlign: TextAlign.center,
              style: AuroraText.titleMedium
                  .copyWith(color: AuroraColors.ember, letterSpacing: 8),
              decoration: const InputDecoration(
                counterText: '',
                hintText: '••••',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dctx),
            child: Text(tr('cancel')),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dctx, ctrl.text.trim()),
            child: Text(tr('confirm')),
          ),
        ],
      ),
    );
    if (otp == null || otp.isEmpty || !mounted) return;
    setState(() => _busy = true);
    final err = await context.read<OrderBloc>().confirmDelivery(order.id, otp);
    if (!mounted) return;
    setState(() => _busy = false);
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(tr('invalidCode')),
          backgroundColor: AuroraColors.danger,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(tr('deliveryConfirmed')),
          backgroundColor: AuroraColors.success,
        ),
      );
    }
  }
}

/// شارة حالة صغيرة
class _StatusChip extends StatelessWidget {
  final OrderStatus status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding:
          const EdgeInsets.symmetric(horizontal: AuroraSpacing.sm, vertical: 4),
      decoration: BoxDecoration(
        color: AuroraColors.ember.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(AuroraRadius.sm),
      ),
      child: Text(
        _label(status),
        style: AuroraText.bodySmall.copyWith(
          color: AuroraColors.ember,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  String _label(OrderStatus s) {
    switch (s) {
      case OrderStatus.driverAccepted:
        return tr('onTheWay');
      case OrderStatus.arrived:
        return tr('arrivedStatus');
      case OrderStatus.started:
        return tr('inProgress');
      default:
        return '';
    }
  }
}
