import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../blocs/order/order_bloc.dart';
import '../../../blocs/order/order_event.dart';
import '../../../blocs/order/order_state.dart';
import '../../../core/config/app_config.dart';
import '../../../core/models/order_model.dart';
import '../../../core/models/service_model.dart';
import '../../../core/theme/app_theme.dart';

class OrderOptionsSheet extends StatefulWidget {
  final GeoPoint origin;
  final GeoPoint destination;
  final String originAddress;
  final String destinationAddress;
  final ServiceModel service;

  const OrderOptionsSheet({
    super.key,
    required this.origin,
    required this.destination,
    required this.originAddress,
    required this.destinationAddress,
    required this.service,
  });

  @override
  State<OrderOptionsSheet> createState() => _OrderOptionsSheetState();
}

class _OrderOptionsSheetState extends State<OrderOptionsSheet> {
  bool _quietRide = false;
  bool _audioOff = false;
  bool _numberMasked = false;

  void _bookRide() {
    context.read<OrderBloc>().add(
          OrderCreateRequested(
            origin: widget.origin,
            destination: widget.destination,
            originAddress: widget.originAddress,
            destinationAddress: widget.destinationAddress,
            service: widget.service,
            regionId: AppConfig.defaultRegionId,
            quietRide: _quietRide,
            audioOff: _audioOff,
            numberMasked: _numberMasked,
          ),
        );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<OrderBloc, OrderState>(
      listener: (ctx, state) {
        if (state is OrderError) {
          ScaffoldMessenger.of(ctx).showSnackBar(
            SnackBar(content: Text(state.message)),
          );
        }
      },
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: HancrColors.divider,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Confirm your ride',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 16),
                // Route summary
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: HancrColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(
                    children: [
                      _RoutePoint(
                        icon: Icons.circle,
                        color: HancrColors.statusGreen,
                        label: widget.originAddress,
                      ),
                      Padding(
                        padding: const EdgeInsets.only(left: 9),
                        child: Container(
                          height: 20,
                          width: 2,
                          color: HancrColors.divider,
                        ),
                      ),
                      _RoutePoint(
                        icon: Icons.location_on,
                        color: HancrColors.accent,
                        label: widget.destinationAddress,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // Service + fare
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: HancrColors.primary.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.directions_car,
                        color: HancrColors.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.service.name,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          Text(
                            'Cash payment',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '~${widget.service.baseFare.toStringAsFixed(0)} SAR',
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                color: HancrColors.primary,
                              ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text(
                  'Ride preferences',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                _PrefToggle(
                  icon: Icons.volume_off,
                  label: 'Quiet Ride',
                  subtitle: 'Prefer a silent trip',
                  value: _quietRide,
                  onChanged: (v) => setState(() => _quietRide = v),
                ),
                _PrefToggle(
                  icon: Icons.music_off,
                  label: 'No Music',
                  subtitle: 'Ask driver to turn off audio',
                  value: _audioOff,
                  onChanged: (v) => setState(() => _audioOff = v),
                ),
                _PrefToggle(
                  icon: Icons.visibility_off,
                  label: 'Hide Number',
                  subtitle: 'Mask your phone from driver',
                  value: _numberMasked,
                  onChanged: (v) => setState(() => _numberMasked = v),
                ),
                const SizedBox(height: 24),
                BlocBuilder<OrderBloc, OrderState>(
                  builder: (ctx, state) {
                    final loading = state is OrderLoading;
                    return ElevatedButton(
                      onPressed: loading ? null : _bookRide,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: HancrColors.accent,
                        foregroundColor: Colors.white,
                      ),
                      child: loading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Book ride'),
                    );
                  },
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoutePoint extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;

  const _RoutePoint({
    required this.icon,
    required this.color,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _PrefToggle extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _PrefToggle({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: value
              ? HancrColors.primary.withValues(alpha: 0.08)
              : HancrColors.surfaceVariant,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(
          icon,
          color: value ? HancrColors.primary : HancrColors.textSecondary,
          size: 20,
        ),
      ),
      title: Text(label, style: Theme.of(context).textTheme.titleMedium),
      subtitle: Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeTrackColor: HancrColors.primary,
        activeThumbColor: Colors.white,
      ),
    );
  }
}
