import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../blocs/location/location_bloc.dart';
import '../../blocs/location/location_event.dart';
import '../../blocs/location/location_state.dart';
import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_event.dart';
import '../../blocs/order/order_state.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/driver_gql.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';
import '../earnings/earnings_tab.dart';
import '../profile/profile_tab.dart';
import '../sos/driver_sos_button.dart';
import '../../blocs/sos/sos_bloc.dart';
import '../../blocs/sos/sos_event.dart';
import '../../blocs/sos/sos_state.dart';
import '../stars/stars_tab.dart';
import 'widgets/active_ride_card.dart';
import 'widgets/incoming_order_sheet.dart';
import 'widgets/map_view.dart';

/// HomeScreen — الشاشة الرئيسية للسائق (Captain Home)
///
/// 4 tabs: الخريطة، الأرباح، النجوم، الحساب
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tabIndex = 0;

  static const _tabs = [
    (label: 'الخريطة', iconOff: Icons.map_outlined, iconOn: Icons.map_rounded),
    (
      label: 'الأرباح',
      iconOff: Icons.account_balance_wallet_outlined,
      iconOn: Icons.account_balance_wallet_rounded,
    ),
    (
      label: 'النجوم',
      iconOff: Icons.star_outline_rounded,
      iconOn: Icons.star_rounded,
    ),
    (
      label: 'الحساب',
      iconOff: Icons.person_outline_rounded,
      iconOn: Icons.person_rounded,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return BlocProvider<SosBloc>(
      create: (_) => SosBloc()..add(const SosLoadRequested()),
      child: BlocListener<SosBloc, SosState>(
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
        child: _buildOrderListener(),
      ),
    );
  }

  Widget _buildOrderListener() {
    return BlocListener<OrderBloc, OrderState>(
      listener: (ctx, state) {
        if (state is OrderIncoming) {
          _showIncomingSheet(ctx, state);
        }
        if (state is OrderCompleted) {
          _showRideSummary(ctx, state);
        }
      },
      child: Scaffold(
        body: IndexedStack(
          index: _tabIndex,
          children: const [
            _MapTab(),
            EarningsTab(),
            StarsTab(),
            ProfileTab(),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _tabIndex,
          onDestinationSelected: (i) => setState(() => _tabIndex = i),
          backgroundColor: HancrColors.surface,
          indicatorColor: HancrColors.violetLight,
          height: 64,
          elevation: 0,
          destinations: _tabs
              .map(
                (t) => NavigationDestination(
                  icon: Icon(t.iconOff),
                  selectedIcon: Icon(t.iconOn, color: HancrColors.violetDeep),
                  label: t.label,
                ),
              )
              .toList(),
        ),
      ),
    );
  }

  void _showIncomingSheet(BuildContext ctx, OrderIncoming state) {
    showModalBottomSheet<void>(
      context: ctx,
      isDismissible: false,
      enableDrag: false,
      isScrollControlled: true,
      builder: (_) => BlocProvider.value(
        value: ctx.read<OrderBloc>(),
        child: IncomingOrderSheet(order: state.order),
      ),
    );
  }

  void _showRideSummary(BuildContext ctx, OrderCompleted state) {
    final o = state.order;
    showDialog<void>(
      context: ctx,
      barrierDismissible: false,
      builder: (dialogCtx) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(HancrSpacing.xl),
          decoration: BoxDecoration(
            color: HancrColors.surface,
            borderRadius: BorderRadius.circular(HancrRadius.xl),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  gradient: HancrColors.violetGradient,
                  shape: BoxShape.circle,
                  boxShadow: HancrShadows.violetGlow,
                ),
                child: const Icon(
                  Icons.check_rounded,
                  color: Colors.white,
                  size: 36,
                ),
              ),
              const SizedBox(height: HancrSpacing.md),
              const Text(
                'الرحلة اكتملت',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: HancrColors.textPrimary,
                ),
              ),
              const SizedBox(height: HancrSpacing.sm),
              Text(
                '${o.costAfterCoupon.toStringAsFixed(0)} ${o.currency}',
                style: const TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.w800,
                  color: HancrColors.violetDeep,
                ),
              ),
              const SizedBox(height: HancrSpacing.sm),
              Text(
                o.destinationAddress,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  color: HancrColors.textSecondary,
                ),
              ),
              const SizedBox(height: HancrSpacing.xl),
              HancrButton.primary(
                label: 'حسناً، استمر',
                icon: Icons.arrow_forward_rounded,
                onPressed: () {
                  Navigator.pop(dialogCtx);
                  if (!ctx.mounted) return;
                  ctx
                      .read<OrderBloc>()
                      .add(const OrderCheckActiveRequested());
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Map Tab (map + online toggle + active ride card)
// ─────────────────────────────────────────────────────────────────────────────

class _MapTab extends StatelessWidget {
  const _MapTab();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Google Map
        const MapView(),

        // Top bar with greeting + online toggle
        Positioned(
          top: MediaQuery.of(context).padding.top + HancrSpacing.md,
          left: HancrSpacing.lg,
          right: HancrSpacing.lg,
          child: const _TopBar(),
        ),

        // SOS floating button — يظهر دائماً، يأخذ موقع السائق + orderId إن وجد
        Positioned(
          top: MediaQuery.of(context).padding.top + 80,
          right: HancrSpacing.lg,
          child: BlocBuilder<LocationBloc, LocationState>(
            builder: (ctx, locState) {
              final lat = locState is LocationTracking ? locState.lat : 0.0;
              final lng = locState is LocationTracking ? locState.lng : 0.0;
              return BlocBuilder<OrderBloc, OrderState>(
                builder: (ctx2, orderState) {
                  final orderId =
                      orderState is OrderActive ? orderState.order.id : null;
                  return DriverSosButton(
                    latitude: lat,
                    longitude: lng,
                    orderId: orderId,
                  );
                },
              );
            },
          ),
        ),

        // Active ride card
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: BlocBuilder<OrderBloc, OrderState>(
            builder: (ctx, state) {
              if (state is OrderActive) {
                return ActiveRideCard(order: state.order);
              }
              return const SizedBox.shrink();
            },
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Top bar with avatar + Online toggle
// ─────────────────────────────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  const _TopBar();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Avatar
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            gradient: HancrColors.violetGradient,
            shape: BoxShape.circle,
            boxShadow: HancrShadows.violetGlow,
            border: Border.all(color: Colors.white, width: 2),
          ),
          child: const Center(
            child: Icon(Icons.person_rounded, color: Colors.white, size: 22),
          ),
        ),

        const Spacer(),

        // Online/Offline toggle
        const _OnlineToggle(),

        const Spacer(),

        // Quick stats button
        HancrIconButton(
          icon: Icons.bar_chart_rounded,
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('إحصائيات سريعة قريباً')),
            );
          },
          shadow: true,
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Online/Offline Toggle
// ─────────────────────────────────────────────────────────────────────────────

class _OnlineToggle extends StatefulWidget {
  const _OnlineToggle();
  @override
  State<_OnlineToggle> createState() => _OnlineToggleState();
}

class _OnlineToggleState extends State<_OnlineToggle>
    with SingleTickerProviderStateMixin {
  bool _toggling = false;
  late final AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
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
        final isOnline = locState is LocationTracking;

        return GestureDetector(
          onTap: _toggling ? null : () => _toggle(ctx, isOnline),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            padding: const EdgeInsets.symmetric(
              horizontal: HancrSpacing.lg,
              vertical: HancrSpacing.md,
            ),
            decoration: BoxDecoration(
              gradient: isOnline
                  ? const LinearGradient(
                      colors: [Color(0xFF34D399), Color(0xFF10B981)],
                    )
                  : HancrColors.brandGradient,
              borderRadius: BorderRadius.circular(HancrRadius.pill),
              boxShadow: isOnline
                  ? [
                      BoxShadow(
                        color: HancrColors.success.withValues(alpha: 0.4),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : HancrShadows.cardElevated,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_toggling)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.2,
                      color: Colors.white,
                    ),
                  )
                else if (isOnline)
                  AnimatedBuilder(
                    animation: _pulseCtrl,
                    builder: (_, __) {
                      return Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.white.withValues(
                                alpha: 0.6 * (1 - _pulseCtrl.value),
                              ),
                              blurRadius: 4 + (8 * _pulseCtrl.value),
                              spreadRadius: 4 * _pulseCtrl.value,
                            ),
                          ],
                        ),
                      );
                    },
                  )
                else
                  const Icon(
                    Icons.power_settings_new_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
                const SizedBox(width: HancrSpacing.sm),
                Text(
                  isOnline ? 'متصل' : 'ابدأ الاستقبال',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _toggle(BuildContext ctx, bool isOnline) async {
    setState(() => _toggling = true);
    final locBloc = ctx.read<LocationBloc>();
    final messenger = ScaffoldMessenger.of(ctx);
    try {
      final client = await GraphQLClientManager.get();
      if (isOnline) {
        locBloc.add(const LocationStopTracking());
        await client.mutate(
          MutationOptions(document: gql(goOfflineMutation)),
        );
        messenger.showSnackBar(
          const SnackBar(
            content: Text('أنت غير متصل الآن'),
            backgroundColor: HancrColors.textSecondary,
            duration: Duration(seconds: 2),
          ),
        );
      } else {
        await client.mutate(
          MutationOptions(document: gql(goOnlineMutation)),
        );
        locBloc.add(const LocationStartTracking());
        messenger.showSnackBar(
          const SnackBar(
            content: Text('أنت متصل — تستقبل الطلبات الآن 🚗'),
            backgroundColor: HancrColors.success,
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(
          content: Text('خطأ: ${e.toString()}'),
          backgroundColor: HancrColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _toggling = false);
    }
  }
}
