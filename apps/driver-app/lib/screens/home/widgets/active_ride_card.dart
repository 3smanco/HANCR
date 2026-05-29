import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../blocs/order/order_bloc.dart';
import '../../../blocs/order/order_event.dart';
import '../../../core/models/order_model.dart';
import '../../../core/theme/app_theme.dart';

/// Bottom card shown while a ride is active, with step buttons
class ActiveRideCard extends StatelessWidget {
  final DriverOrderModel order;
  const ActiveRideCard({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 20,
            offset: Offset(0, -4),
          ),
        ],
      ),
      padding: EdgeInsets.fromLTRB(
        20, 16, 20, 16 + MediaQuery.of(context).padding.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Status
          _StatusBadge(status: order.status),
          const SizedBox(height: 14),

          // Rider info row
          Row(
            children: [
              // Avatar
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: HancrColors.primary,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Text(
                    order.riderName?.isNotEmpty == true
                        ? order.riderName![0].toUpperCase()
                        : 'R',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order.riderName ?? 'Rider',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Row(
                      children: [
                        const Icon(Icons.star,
                            color: HancrColors.accent, size: 13),
                        const SizedBox(width: 3),
                        Text(
                          order.riderRating.toStringAsFixed(1),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Text(
                '${order.costAfterCoupon.toStringAsFixed(0)} ${order.currency}',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: HancrColors.primary,
                    ),
              ),
            ],
          ),

          // OTP code (if set)
          if (order.otpCode != null) ...[
            const SizedBox(height: 12),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: HancrColors.surfaceVariant,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.lock_outline,
                      size: 14, color: HancrColors.textSecondary),
                  const SizedBox(width: 6),
                  Text(
                    'OTP: ${order.otpCode}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 14),

          // Destination
          Row(
            children: [
              const Icon(Icons.location_on,
                  color: HancrColors.accent, size: 16),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  order.destinationAddress,
                  style: Theme.of(context).textTheme.bodyMedium,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Action button based on current status
          _buildActionButton(context),

          const SizedBox(height: 10),

          // Cancel link
          if (order.status == OrderStatus.driverAccepted)
            TextButton(
              onPressed: () => _confirmCancel(context),
              child: const Text(
                'Cancel ride',
                style: TextStyle(color: HancrColors.error),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildActionButton(BuildContext context) {
    switch (order.status) {
      case OrderStatus.driverAccepted:
        return ElevatedButton.icon(
          onPressed: () => context
              .read<OrderBloc>()
              .add(OrderArrivedAtPickupRequested(order.id)),
          icon: const Icon(Icons.location_on),
          label: const Text('Arrived at Pickup'),
          style: ElevatedButton.styleFrom(
              backgroundColor: HancrColors.statusBlue),
        );
      case OrderStatus.arrived:
        return ElevatedButton.icon(
          onPressed: () => context
              .read<OrderBloc>()
              .add(OrderStartRideRequested(order.id)),
          icon: const Icon(Icons.play_arrow),
          label: const Text('Start Ride'),
          style: ElevatedButton.styleFrom(
              backgroundColor: HancrColors.onlineGreen),
        );
      case OrderStatus.started:
        return ElevatedButton.icon(
          onPressed: () => context
              .read<OrderBloc>()
              .add(OrderFinishRideRequested(order.id)),
          icon: const Icon(Icons.flag),
          label: const Text('Finish Ride'),
          style: ElevatedButton.styleFrom(
              backgroundColor: HancrColors.accent),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  void _confirmCancel(BuildContext context) {
    showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Cancel ride?'),
        content: const Text('A cancellation fee may apply.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: HancrColors.error),
            child: const Text('Yes, cancel'),
          ),
        ],
      ),
    ).then((confirmed) {
      if (confirmed == true && context.mounted) {
        context.read<OrderBloc>().add(OrderCancelRequested(order.id));
      }
    });
  }
}

class _StatusBadge extends StatelessWidget {
  final OrderStatus status;
  const _StatusBadge({required this.status});

  Color get _color {
    switch (status) {
      case OrderStatus.driverAccepted:
        return HancrColors.statusBlue;
      case OrderStatus.arrived:
        return HancrColors.statusOrange;
      case OrderStatus.started:
        return HancrColors.onlineGreen;
      default:
        return HancrColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: _color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Text(
            status.label,
            style: TextStyle(
              color: _color,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
