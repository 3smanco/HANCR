import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_event.dart';
import '../../blocs/order/order_state.dart';
import '../../core/models/order_model.dart';
import '../../core/theme/app_theme.dart';

class RidesTab extends StatefulWidget {
  const RidesTab({super.key});

  @override
  State<RidesTab> createState() => _RidesTabState();
}

class _RidesTabState extends State<RidesTab> {
  @override
  void initState() {
    super.initState();
    context.read<OrderBloc>().add(const OrderHistoryRequested());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My rides'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context
                .read<OrderBloc>()
                .add(const OrderHistoryRequested()),
          ),
        ],
      ),
      body: BlocBuilder<OrderBloc, OrderState>(
        builder: (ctx, state) {
          if (state is OrderLoading) {
            return _buildShimmer();
          }
          if (state is OrderHistoryLoaded) {
            if (state.orders.isEmpty) {
              return _buildEmpty();
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: state.orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (ctx, i) => _RideCard(order: state.orders[i]),
            );
          }
          if (state is OrderError) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, size: 48,
                      color: HancrColors.error),
                  const SizedBox(height: 12),
                  Text(state.message),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => ctx
                        .read<OrderBloc>()
                        .add(const OrderHistoryRequested()),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }
          return _buildShimmer();
        },
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.history, size: 72, color: HancrColors.textHint),
          const SizedBox(height: 16),
          Text(
            'No rides yet',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Your completed rides will appear here',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }

  Widget _buildShimmer() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 6,
      itemBuilder: (_, i) => Container(
        height: 90,
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: HancrColors.surfaceVariant,
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }
}

class _RideCard extends StatelessWidget {
  final OrderModel order;
  const _RideCard({required this.order});

  @override
  Widget build(BuildContext context) {
    final isCompleted = order.status == OrderStatus.finished;
    final statusColor =
        isCompleted ? HancrColors.statusGreen : HancrColors.statusOrange;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: HancrColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  order.destinationAddress,
                  style: Theme.of(context).textTheme.titleMedium,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                '${order.paidAmount.toStringAsFixed(0)} ${order.currency}',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: HancrColors.primary,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              // Status chip
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  order.status.label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                order.distanceLabel,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(width: 8),
              Text(
                'Â·',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(width: 8),
              Text(
                order.durationLabel,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const Spacer(),
              Text(
                DateFormat('d MMM').format(order.createdOn.toLocal()),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          if (order.driverName != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(
                  Icons.person_outline,
                  size: 14,
                  color: HancrColors.textSecondary,
                ),
                const SizedBox(width: 4),
                Text(
                  order.driverName!,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (order.carBrand != null) ...[
                  const SizedBox(width: 6),
                  Text('Â·', style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(width: 6),
                  Text(
                    '${order.carBrand} ${order.carModel ?? ''}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ],
        ],
      ),
    );
  }
}
