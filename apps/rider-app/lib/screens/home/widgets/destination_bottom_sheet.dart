import 'package:flutter/material.dart';
import '../../../core/models/order_model.dart';
import '../../../core/theme/app_theme.dart';

class DestinationBottomSheet extends StatefulWidget {
  final GeoPoint? origin;
  final String originAddress;

  const DestinationBottomSheet({
    super.key,
    this.origin,
    required this.originAddress,
  });

  @override
  State<DestinationBottomSheet> createState() =>
      _DestinationBottomSheetState();
}

class _DestinationBottomSheetState extends State<DestinationBottomSheet> {
  final _ctrl = TextEditingController();

  // Mock popular places (replace with real geocoding in production)
  final _suggestions = const [
    _Place('Riyadh Front', 'Entertainment Avenue, Riyadh', 24.7614, 46.6382),
    _Place('King Fahd Road', 'Al Olaya, Riyadh', 24.7136, 46.6753),
    _Place('King Abdullah Fin. District', 'North Riyadh', 24.7610, 46.6213),
    _Place('Riyadh Park Mall', 'Al Nakheel, Riyadh', 24.7544, 46.6618),
    _Place('Al Faisaliyah Tower', 'Olaya, Riyadh', 24.6915, 46.6856),
    _Place('Kingdom Centre', 'Al Olaya, Riyadh', 24.6887, 46.6850),
  ];

  List<_Place> _filtered = [];

  @override
  void initState() {
    super.initState();
    _filtered = _suggestions;
    _ctrl.addListener(() {
      final q = _ctrl.text.trim().toLowerCase();
      setState(() {
        _filtered = q.isEmpty
            ? _suggestions
            : _suggestions
                .where((p) =>
                    p.name.toLowerCase().contains(q) ||
                    p.subtitle.toLowerCase().contains(q))
                .toList();
      });
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _select(_Place place) {
    Navigator.pop(context, {
      'point': GeoPoint(lat: place.lat, lng: place.lng),
      'address': place.name,
    });
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Handle
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
            // Origin indicator
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: HancrColors.statusGreen,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      widget.originAddress.isEmpty
                          ? 'Your location'
                          : widget.originAddress,
                      style: Theme.of(context).textTheme.bodyMedium,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            // Destination input
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: TextField(
                controller: _ctrl,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: 'Search destination',
                  prefixIcon: Icon(
                    Icons.location_on,
                    color: HancrColors.accent,
                  ),
                  suffixIcon: _ctrl.text.isNotEmpty
                      ? IconButton(
                          icon: Icon(Icons.clear),
                          onPressed: () => _ctrl.clear(),
                        )
                      : null,
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Divider(),
            // Suggestions list
            Expanded(
              child: ListView.builder(
                controller: scrollCtrl,
                padding: EdgeInsets.zero,
                itemCount: _filtered.length,
                itemBuilder: (ctx, i) {
                  final place = _filtered[i];
                  return ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: HancrColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        Icons.location_on_outlined,
                        color: HancrColors.textSecondary,
                        size: 20,
                      ),
                    ),
                    title: Text(
                      place.name,
                      style: Theme.of(ctx).textTheme.titleMedium,
                    ),
                    subtitle: Text(
                      place.subtitle,
                      style: Theme.of(ctx).textTheme.bodySmall,
                    ),
                    onTap: () => _select(place),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Place {
  final String name;
  final String subtitle;
  final double lat;
  final double lng;
  const _Place(this.name, this.subtitle, this.lat, this.lng);
}
