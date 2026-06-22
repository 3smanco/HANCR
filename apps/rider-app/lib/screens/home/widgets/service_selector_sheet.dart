import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../../core/config/app_config.dart';
import '../../../core/graphql/graphql_client.dart';
import '../../../core/graphql/gql/rider_gql.dart';
import '../../../core/models/order_model.dart';
import '../../../core/models/service_model.dart';
import '../../../core/theme/app_theme.dart';

class ServiceSelectorSheet extends StatefulWidget {
  final GeoPoint origin;
  final GeoPoint destination;

  const ServiceSelectorSheet({
    super.key,
    required this.origin,
    required this.destination,
  });

  @override
  State<ServiceSelectorSheet> createState() => _ServiceSelectorSheetState();
}

class _ServiceSelectorSheetState extends State<ServiceSelectorSheet> {
  List<ServiceModel> _services = [];
  int _selectedIndex = 0;
  bool _loading = true;
  String? _error;

  // Estimated distance (Haversine)
  late final int _distanceM;

  @override
  void initState() {
    super.initState();
    _distanceM = _estimate();
    _loadServices();
  }

  int _estimate() {
    const r = 6371000.0;
    final lat1 = widget.origin.lat * 3.14159265 / 180;
    final lat2 = widget.destination.lat * 3.14159265 / 180;
    final dLat =
        (widget.destination.lat - widget.origin.lat) * 3.14159265 / 180;
    final dLng =
        (widget.destination.lng - widget.origin.lng) * 3.14159265 / 180;
    final a = _sin2(dLat / 2) + _cos(lat1) * _cos(lat2) * _sin2(dLng / 2);
    return (r * 2 * _atan2(_sqrt(a), _sqrt(1 - a))).round();
  }

  double _sin2(double x) => _sin(x) * _sin(x);
  double _sin(double x) => x - x * x * x / 6;
  double _cos(double x) => 1 - x * x / 2;
  double _sqrt(double x) => x < 0
      ? 0
      : x == 0
          ? 0
          : x < 1
              ? 1 - (1 - x) / 2
              : x;
  double _atan2(double y, double x) =>
      x > 0 ? y / x : (y >= 0 ? 3.14159 : -3.14159);

  Future<void> _loadServices() async {
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.query(
        QueryOptions(
          document: gql(servicesQuery),
          variables: const {'regionId': AppConfig.defaultRegionId},
        ),
      );
      final list = (result.data?['services'] as List<dynamic>?) ?? [];
      setState(() {
        _services = list
            .map((e) => ServiceModel.fromJson(e as Map<String, dynamic>))
            .toList();
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  double _estimateFare(ServiceModel s) {
    final base = s.baseFare;
    final distKm = _distanceM / 1000;
    final perKm = (s.baseFare / 5).clamp(1.0, 10.0); // rough estimate
    final fare = base + (distKm * perKm);
    return fare < s.minimumFee ? s.minimumFee : fare;
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      builder: (_, ctrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
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
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Choose a ride',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  Text(
                    '${(_distanceM / 1000).toStringAsFixed(1)} km',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            if (_loading)
              const Expanded(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_error != null || _services.isEmpty)
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.directions_car_filled_outlined,
                        size: 56,
                        color: HancrColors.textHint,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _services.isEmpty
                            ? 'No services available in your area'
                            : 'Failed to load services',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              )
            else ...[
              Expanded(
                child: ListView.builder(
                  controller: ctrl,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _services.length,
                  itemBuilder: (ctx, i) {
                    final s = _services[i];
                    final fare = _estimateFare(s);
                    final selected = i == _selectedIndex;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedIndex = i),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: selected
                              ? HancrColors.primary.withValues(alpha: 0.06)
                              : HancrColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: selected
                                ? HancrColors.primary
                                : Colors.transparent,
                            width: 1.5,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color:
                                    HancrColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.directions_car,
                                color: HancrColors.primary,
                                size: 26,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        s.name,
                                        style:
                                            Theme.of(ctx).textTheme.titleMedium,
                                      ),
                                      if (s.isVip) ...[
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: HancrColors.accent
                                                .withValues(alpha: 0.15),
                                            borderRadius:
                                                BorderRadius.circular(4),
                                          ),
                                          child: const Text(
                                            'VIP',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                              color: HancrColors.accent,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${((_distanceM / 8 / 60)).ceil()} min away',
                                    style: Theme.of(ctx).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              '${fare.toStringAsFixed(0)} SAR',
                              style:
                                  Theme.of(ctx).textTheme.titleMedium?.copyWith(
                                        color: HancrColors.primary,
                                        fontWeight: FontWeight.w700,
                                      ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context, _services[_selectedIndex]);
                  },
                  child: const Text('Select'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
