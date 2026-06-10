import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_event.dart';
import '../../blocs/order/order_state.dart';
import '../../core/models/order_model.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// قائمة الرحلات القابلة لإعادة الاستخدام (تبويب + صفحة مدفوعة).
class AuroraRidesView extends StatefulWidget {
  const AuroraRidesView({super.key});
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
              padding: const EdgeInsets.all(AuroraSpacing.lg),
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
              child: Icon(Icons.local_taxi,
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
                _statusChip(o.status.label),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: AuroraColors.smoke,
        borderRadius: BorderRadius.circular(AuroraRadius.pill),
      ),
      child: Text(label,
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

              // معلومات
              _card(Column(
                children: [
                  _infoRow(tr('date'), df.format(order.createdOn)),
                  _divider(),
                  _infoRow(tr('status'), order.status.label),
                  _divider(),
                  _infoRow(tr('distance'), order.distanceLabel),
                  _divider(),
                  _infoRow(tr('duration'), order.durationLabel),
                  if (order.driverName != null) ...[
                    _divider(),
                    _infoRow(tr('driver'), order.driverName!),
                  ],
                  if (order.carModel != null) ...[
                    _divider(),
                    _infoRow(tr('car'),
                        '${order.carBrand ?? ''} ${order.carModel ?? ''} ${order.plateNumber ?? ''}'),
                  ],
                ],
              )),
              const SizedBox(height: AuroraSpacing.md),

              // الفاتورة
              _card(Column(
                children: [
                  _infoRow(tr('cost'),
                      '${order.costBest.toStringAsFixed(2)} ${order.currency}'),
                  if (order.paidAmount > 0) ...[
                    _divider(),
                    _infoRow(tr('paid'),
                        '${order.paidAmount.toStringAsFixed(2)} ${order.currency}'),
                  ],
                ],
              )),
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
