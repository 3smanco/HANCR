import '../../core/i18n/app_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:intl/intl.dart';
import '../bids/driver_bids_screen.dart';
import '../../blocs/location/location_bloc.dart';
import '../../blocs/location/location_event.dart';
import '../../blocs/location/location_state.dart';
import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_state.dart';
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
      decoration: const BoxDecoration(
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
                      const Icon(Icons.gavel,
                          color: AuroraColors.ember, size: 16),
                      const SizedBox(width: 6),
                      Text(tr('bids'),
                          style: const TextStyle(
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
                decoration: const BoxDecoration(
                  gradient: AuroraColors.emberGradient,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.person,
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
                  ? const LinearGradient(
                      colors: [AuroraColors.success, Color(0xFF059669)],
                    )
                  : AuroraColors.emberGradient,
              borderRadius: BorderRadius.circular(AuroraRadius.xl),
              boxShadow: online
                  ? const [
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
                  const SizedBox(
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
class _ActiveRideCard extends StatelessWidget {
  final dynamic order;
  const _ActiveRideCard({required this.order});

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
                child: const Icon(Icons.local_taxi,
                    color: AuroraColors.ember, size: 22),
              ),
              const SizedBox(width: AuroraSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tr('activeRide'),
                      style: AuroraText.titleSmall,
                    ),
                    Text(
                      '${fmt.format(order.costAfterCoupon ?? 0)} ${order.currency ?? ''}',
                      style: AuroraText.bodySmall.copyWith(
                        color: AuroraColors.ember,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios,
                  color: AuroraColors.textSecondary, size: 14),
            ],
          ),
        ],
      ),
    );
  }
}
