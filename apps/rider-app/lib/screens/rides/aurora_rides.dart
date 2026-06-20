import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_event.dart';
import '../../blocs/order/order_state.dart';
import '../../core/models/order_model.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/widgets/rider_avatar.dart';
import 'trip_help_form_screen.dart';

/// أيقونة حسب نوع الخدمة.
IconData _serviceIcon(String type) {
  if (type.contains('Parcel')) return Icons.local_shipping_outlined;
  if (type.contains('Grocery') || type.contains('Shop')) {
    return Icons.shopping_basket_outlined;
  }
  if (type.contains('Hourly') || type.contains('Chauffeur')) {
    return Icons.schedule_outlined;
  }
  return Icons.local_taxi;
}

bool _isCanceled(OrderModel o) =>
    o.status == OrderStatus.riderCanceled ||
    o.status == OrderStatus.driverCanceled;

/// قائمة الرحلات القابلة لإعادة الاستخدام (تبويب + صفحة مدفوعة).
class AuroraRidesView extends StatefulWidget {
  /// حشوة سفلية إضافية — تُمرَّر من تبويب النشاط ليتجاوز الشريط السفلي العائم.
  /// تبقى = AuroraSpacing.lg في الصفحة المدفوعة (RidesHistoryScreen) حيث لا شريط.
  final double bottomInset;
  const AuroraRidesView({super.key, this.bottomInset = AuroraSpacing.lg});
  @override
  State<AuroraRidesView> createState() => _AuroraRidesViewState();
}

class _AuroraRidesViewState extends State<AuroraRidesView> {
  @override
  void initState() {
    super.initState();
    context.read<OrderBloc>().add(const OrderHistoryRequested());
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<OrderBloc, OrderState>(
      builder: (ctx, state) {
        if (state is OrderLoading) {
          return Center(
              child: CircularProgressIndicator(color: AuroraColors.ember));
        }
        if (state is OrderHistoryLoaded) {
          if (state.orders.isEmpty) return _empty();
          return RefreshIndicator(
            color: AuroraColors.ember,
            backgroundColor: AuroraColors.ash,
            onRefresh: () async => context
                .read<OrderBloc>()
                .add(const OrderHistoryRequested()),
            child: ListView.builder(
              padding: EdgeInsets.fromLTRB(AuroraSpacing.lg, AuroraSpacing.lg,
                  AuroraSpacing.lg, widget.bottomInset),
              itemCount: state.orders.length,
              itemBuilder: (_, i) => _rideCard(context, state.orders[i]),
            ),
          );
        }
        // حالات أخرى (idle/active) — اطلب السجل
        return _empty();
      },
    );
  }

  Widget _empty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.receipt_long_outlined,
              color: AuroraColors.textHint, size: 64),
          const SizedBox(height: AuroraSpacing.md),
          Text(tr('noRides'), style: AuroraText.titleMedium),
          const SizedBox(height: 4),
          Text(tr('ridesEmptySub'), style: AuroraText.bodySmall),
        ],
      ),
    );
  }

  Widget _rideCard(BuildContext context, OrderModel o) {
    final df = DateFormat('d MMM • h:mm a', 'ar');
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => RideDetailsScreen(order: o)),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
        padding: const EdgeInsets.all(AuroraSpacing.md),
        decoration: BoxDecoration(
          color: AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          border: Border.all(color: AuroraColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AuroraColors.coal,
                borderRadius: BorderRadius.circular(AuroraRadius.sm),
              ),
              child: Icon(_serviceIcon(o.type),
                  color: AuroraColors.ember, size: 22),
            ),
            const SizedBox(width: AuroraSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(o.destinationAddress,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AuroraText.titleSmall),
                  const SizedBox(height: 2),
                  Text(df.format(o.createdOn), style: AuroraText.caption),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('${o.costBest.toStringAsFixed(0)} ${o.currency}',
                    style: AuroraText.titleSmall
                        .copyWith(color: AuroraColors.pearl)),
                const SizedBox(height: 2),
                if (_isCanceled(o)) _canceledBadge(),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _canceledBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: AuroraColors.smoke,
        borderRadius: BorderRadius.circular(AuroraRadius.pill),
      ),
      child: Text(tr('canceled'),
          style: AuroraText.caption.copyWith(color: AuroraColors.textSecondary)),
    );
  }
}

/// صفحة سجل الرحلات (مدفوعة من الحساب).
class RidesHistoryScreen extends StatelessWidget {
  const RidesHistoryScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('myRides'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: const AuroraBackground(child: AuroraRidesView()),
    );
  }
}

/// نمط خريطة داكن مبسّط (Aurora) — يُخفي معالم زائدة ويغمّق الخلفية.
const String _kMiniMapDark = '''
[{"elementType":"geometry","stylers":[{"color":"#13100e"}]},
{"elementType":"labels.text.fill","stylers":[{"color":"#8a817a"}]},
{"elementType":"labels.text.stroke","stylers":[{"color":"#13100e"}]},
{"featureType":"poi","stylers":[{"visibility":"off"}]},
{"featureType":"road","elementType":"geometry","stylers":[{"color":"#2a2421"}]},
{"featureType":"water","elementType":"geometry","stylers":[{"color":"#0a0807"}]}]
''';

/// تفاصيل رحلة واحدة.
class RideDetailsScreen extends StatelessWidget {
  final OrderModel order;
  const RideDetailsScreen({required this.order, super.key});

  @override
  Widget build(BuildContext context) {
    final df = DateFormat('EEEE d MMMM yyyy • h:mm a', 'ar');
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('rideDetails'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
        actions: [
          // N9 — مشاركة الإيصال
          IconButton(
            onPressed: () => Share.share(_receipt()),
            icon: Icon(Icons.ios_share, color: AuroraColors.pearl),
          ),
        ],
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: ListView(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            children: [
              // الخريطة (النصف العلوي)
              _miniMap(),
              const SizedBox(height: AuroraSpacing.md),

              // سطر الحالة بالتاريخ المفصّل
              Text(
                _isCanceled(order)
                    ? '${tr('canceledOn')} ${df.format(order.createdOn)}'
                    : '${tr('completedOn')} ${df.format(order.finishTimestamp ?? order.createdOn)}',
                style: AuroraText.bodyMedium.copyWith(
                    color: _isCanceled(order)
                        ? AuroraColors.danger
                        : AuroraColors.pearl),
              ),
              const SizedBox(height: AuroraSpacing.md),

              // المسار
              _card(Column(
                children: [
                  _routeRow(Icons.my_location, AuroraColors.success,
                      order.originAddress),
                  const Padding(
                    padding: EdgeInsets.only(right: 9),
                    child: SizedBox(
                      height: 20,
                      child: VerticalDivider(
                          color: AuroraColors.border, width: 2, thickness: 2),
                    ),
                  ),
                  _routeRow(
                      Icons.location_on, AuroraColors.ember, order.destinationAddress),
                ],
              )),
              const SizedBox(height: AuroraSpacing.md),

              // السائق والمركبة
              if (order.driverName != null) ...[
                _driverCard(),
                const SizedBox(height: AuroraSpacing.md),
              ],

              // الإيصال (قابل للطيّ)
              _receiptCard(),
              const SizedBox(height: AuroraSpacing.lg),

              // المساعدة الخاصة بالرحلة
              Text(tr('help'), style: AuroraText.titleSmall),
              const SizedBox(height: AuroraSpacing.sm),
              _helpRow(context, Icons.luggage_outlined, tr('helpLostItem'),
                  'other'),
              _helpRow(context, Icons.shield_outlined, tr('helpSafety'),
                  'safety'),
              _helpRow(context, Icons.receipt_long_outlined, tr('helpFare'),
                  'fare'),
              _helpRow(context, Icons.help_outline, tr('helpGeneral'),
                  'other'),
            ],
          ),
        ),
      ),
    );
  }

  // N9 — نص الإيصال للمشاركة
  String _receipt() {
    final df = DateFormat('yyyy-MM-dd HH:mm', 'ar');
    final b = StringBuffer()
      ..writeln('HANCR — ${tr('rideDetails')}')
      ..writeln('${tr('date')}: ${df.format(order.createdOn)}')
      ..writeln('${order.originAddress} → ${order.destinationAddress}')
      ..writeln('${tr('distance')}: ${order.distanceLabel} · ${tr('duration')}: ${order.durationLabel}')
      ..writeln('${tr('cost')}: ${order.costBest.toStringAsFixed(2)} ${order.currency}');
    if (order.paidAmount > 0) {
      b.writeln('${tr('paid')}: ${order.paidAmount.toStringAsFixed(2)} ${order.currency}');
    }
    if (order.driverName != null) {
      b.writeln('${tr('driver')}: ${order.driverName}');
    }
    return b.toString();
  }

  Widget _miniMap() {
    final pts = order.points;
    if (pts.length < 2) {
      // احتياط: لا إحداثيات — بانر بسيط
      return Container(
        height: 160,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AuroraColors.coal,
          borderRadius: BorderRadius.circular(AuroraRadius.lg),
          border: Border.all(color: AuroraColors.border),
        ),
        child: Icon(Icons.map_outlined,
            color: AuroraColors.textHint, size: 40),
      );
    }
    final coords = pts.map((p) => LatLng(p.lat, p.lng)).toList();
    final lats = coords.map((c) => c.latitude);
    final lngs = coords.map((c) => c.longitude);
    final center = LatLng(
      (lats.reduce((a, b) => a < b ? a : b) +
              lats.reduce((a, b) => a > b ? a : b)) /
          2,
      (lngs.reduce((a, b) => a < b ? a : b) +
              lngs.reduce((a, b) => a > b ? a : b)) /
          2,
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(AuroraRadius.lg),
      child: SizedBox(
        height: 200,
        child: GoogleMap(
          liteModeEnabled: true,
          style: _kMiniMapDark,
          initialCameraPosition: CameraPosition(target: center, zoom: 12.5),
          zoomControlsEnabled: false,
          myLocationButtonEnabled: false,
          markers: {
            Marker(
                markerId: const MarkerId('pickup'),
                position: coords.first,
                icon: BitmapDescriptor.defaultMarkerWithHue(
                    BitmapDescriptor.hueGreen)),
            Marker(
                markerId: const MarkerId('dropoff'),
                position: coords.last,
                icon: BitmapDescriptor.defaultMarkerWithHue(
                    BitmapDescriptor.hueOrange)),
          },
          polylines: {
            Polyline(
              polylineId: const PolylineId('route'),
              points: coords,
              color: AuroraColors.ember,
              width: 4,
            ),
          },
        ),
      ),
    );
  }

  Widget _driverCard() => _card(Row(
        children: [
          RiderAvatar(
              avatarUrl: order.driverAvatarUrl,
              initial: (order.driverName ?? '?').isNotEmpty
                  ? order.driverName![0].toUpperCase()
                  : '?',
              size: 48,
              editable: false),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(order.driverName ?? '—', style: AuroraText.titleSmall),
                const SizedBox(height: 2),
                Text(
                    [
                      order.carColor,
                      order.carBrand,
                      order.carModel,
                    ].where((s) => s != null && s.isNotEmpty).join(' '),
                    style: AuroraText.bodySmall),
                if ((order.plateNumber ?? '').isNotEmpty)
                  Text(order.plateNumber!, style: AuroraText.caption),
              ],
            ),
          ),
          if (order.driverRating != null)
            Row(
              children: [
                Icon(Icons.star, color: AuroraColors.gold, size: 16),
                const SizedBox(width: 2),
                Text(order.driverRating!.toStringAsFixed(2),
                    style: AuroraText.bodyMedium
                        .copyWith(color: AuroraColors.pearl)),
              ],
            ),
        ],
      ));

  Widget _receiptCard() {
    final discount = order.costBest - order.costAfterCoupon;
    return Container(
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Theme(
        data: ThemeData(dividerColor: Colors.transparent),
        child: ExpansionTile(
          iconColor: AuroraColors.ember,
          collapsedIconColor: AuroraColors.textSecondary,
          leading: Icon(Icons.receipt_long_outlined, color: AuroraColors.ember),
          title: Text(tr('viewReceipt'),
              style:
                  AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl)),
          childrenPadding: const EdgeInsets.fromLTRB(
              AuroraSpacing.lg, 0, AuroraSpacing.lg, AuroraSpacing.md),
          children: [
            _infoRow(tr('cost'),
                '${order.costBest.toStringAsFixed(2)} ${order.currency}'),
            if (discount > 0.01) ...[
              _divider(),
              _infoRow(tr('discount'),
                  '-${discount.toStringAsFixed(2)} ${order.currency}'),
            ],
            if (order.paidAmount > 0) ...[
              _divider(),
              _infoRow(tr('paid'),
                  '${order.paidAmount.toStringAsFixed(2)} ${order.currency}'),
            ],
          ],
        ),
      ),
    );
  }

  Widget _helpRow(
      BuildContext context, IconData icon, String title, String category) {
    return AuroraListRow(
      icon: icon,
      title: title,
      onTap: () => Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => TripHelpFormScreen(
          orderId: order.id,
          category: category,
          title: title,
        ),
      )),
    );
  }

  Widget _card(Widget child) => Container(
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        decoration: BoxDecoration(
          color: AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          border: Border.all(color: AuroraColors.border),
        ),
        child: child,
      );

  Widget _routeRow(IconData icon, Color color, String label) => Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
              child: Text(label,
                  style: AuroraText.bodyMedium
                      .copyWith(color: AuroraColors.pearl))),
        ],
      );

  Widget _infoRow(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: AuroraText.bodySmall),
            Flexible(
                child: Text(value,
                    textAlign: TextAlign.end,
                    style: AuroraText.bodyMedium
                        .copyWith(color: AuroraColors.pearl))),
          ],
        ),
      );

  Widget _divider() =>
      const Divider(color: AuroraColors.border, height: AuroraSpacing.md);
}
