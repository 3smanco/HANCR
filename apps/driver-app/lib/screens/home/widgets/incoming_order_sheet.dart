import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../blocs/order/order_bloc.dart';
import '../../../blocs/order/order_event.dart';
import '../../../blocs/order/order_state.dart';
import '../../../core/models/order_model.dart';
import '../../../core/theme/app_theme.dart';

class IncomingOrderSheet extends StatefulWidget {
  final DriverOrderModel order;
  const IncomingOrderSheet({super.key, required this.order});
  @override
  State<IncomingOrderSheet> createState() => _IncomingOrderSheetState();
}

class _IncomingOrderSheetState extends State<IncomingOrderSheet> {
  int _countdown = 25; // 25 seconds to accept
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_countdown > 0) {
        setState(() => _countdown--);
      } else {
        _decline();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _accept() {
    _timer?.cancel();
    context.read<OrderBloc>().add(OrderAcceptRequested(widget.order.id));
    Navigator.pop(context);
  }

  void _decline() {
    _timer?.cancel();
    context.read<OrderBloc>().add(const OrderDeclineRequested());
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<OrderBloc, OrderState>(
      listener: (ctx, state) {
        if (state is OrderActive) Navigator.of(ctx).popUntil((r) => r.isFirst);
        if (state is OrderError) Navigator.pop(ctx);
      },
      child: Container(
        padding: EdgeInsets.fromLTRB(
          20, 12, 20, 20 + MediaQuery.of(context).padding.bottom,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: HancrColors.divider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Countdown ring
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 72,
                  height: 72,
                  child: CircularProgressIndicator(
                    value: _countdown / 25,
                    strokeWidth: 5,
                    backgroundColor: HancrColors.surfaceVariant,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      _countdown > 10
                          ? HancrColors.onlineGreen
                          : HancrColors.statusRed,
                    ),
                  ),
                ),
                Text(
                  '$_countdown',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ],
            ),
            const SizedBox(height: 16),

            Text(
              'New Ride Request',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),

            // Trip info
            _TripRow(
              origin: widget.order.originAddress,
              destination: widget.order.destinationAddress,
            ),
            const SizedBox(height: 12),

            // Stats row
            Row(
              children: [
                Expanded(
                  child: _InfoChip(
                    icon: Icons.route,
                    label: widget.order.distanceLabel,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _InfoChip(
                    icon: Icons.access_time,
                    label: widget.order.durationLabel,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _InfoChip(
                    icon: Icons.payments_outlined,
                    label:
                        '${widget.order.costAfterCoupon.toStringAsFixed(0)} ${widget.order.currency}',
                    bold: true,
                    color: HancrColors.primary,
                  ),
                ),
              ],
            ),

            // Ride mood icons
            if (widget.order.quietRide || widget.order.audioOff) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  if (widget.order.quietRide)
                    _MoodChip(icon: Icons.do_not_disturb, label: 'Quiet ride'),
                  if (widget.order.audioOff)
                    _MoodChip(icon: Icons.music_off, label: 'Audio off'),
                ],
              ),
            ],

            // Rider rating
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.star, color: HancrColors.accent, size: 16),
                const SizedBox(width: 4),
                Text(
                  widget.order.riderRating.toStringAsFixed(1),
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(width: 6),
                if (widget.order.riderName != null)
                  Text(
                    widget.order.riderName!,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                const Spacer(),
                Text(
                  widget.order.paymentMode.toUpperCase(),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: HancrColors.statusBlue,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _decline,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: HancrColors.error,
                      side: const BorderSide(color: HancrColors.error),
                    ),
                    child: const Text('Decline'),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _accept,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: HancrColors.onlineGreen,
                    ),
                    child: const Text('Accept'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TripRow extends StatelessWidget {
  final String origin;
  final String destination;
  const _TripRow({required this.origin, required this.destination});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Column(
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: HancrColors.statusGreen,
                shape: BoxShape.circle,
              ),
            ),
            Container(
              width: 1,
              height: 30,
              color: HancrColors.divider,
            ),
            Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: HancrColors.accent,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(origin,
                  style: Theme.of(context).textTheme.bodyMedium,
                  overflow: TextOverflow.ellipsis),
              const SizedBox(height: 16),
              Text(destination,
                  style: Theme.of(context).textTheme.titleMedium,
                  overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ],
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool bold;
  final Color? color;
  const _InfoChip({
    required this.icon,
    required this.label,
    this.bold = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: HancrColors.surfaceVariant,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        children: [
          Icon(icon, size: 18, color: color ?? HancrColors.textSecondary),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
              color: color ?? HancrColors.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _MoodChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _MoodChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: HancrColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: HancrColors.primary),
          const SizedBox(width: 4),
          Text(label,
              style: const TextStyle(
                  fontSize: 11, color: HancrColors.primary)),
        ],
      ),
    );
  }
}
