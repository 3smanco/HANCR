import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/config/app_config.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/flight_gql.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// شاشة Airport Pickup — يدخل الراكب رقم رحلة طيران وعنوان التوصيل،
/// ونتعقّب رحلته آلياً ونحجز طلباً قبل الوصول الفعلي بـ 30 دقيقة.
class AuroraAirportScreen extends StatefulWidget {
  const AuroraAirportScreen({super.key});

  @override
  State<AuroraAirportScreen> createState() => _AuroraAirportScreenState();
}

class _AuroraAirportScreenState extends State<AuroraAirportScreen> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  bool _saving = false;
  int? _serviceId;
  Map<String, dynamic>? _selectedPlace;
  List<Map<String, dynamic>> _savedPlaces = [];
  final _flightCtrl = TextEditingController();
  DateTime _flightDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _flightCtrl.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    try {
      final client = await GraphQLClientManager.get();
      final results = await Future.wait([
        client.query(QueryOptions(
          document: gql(flightTrackingsQuery),
          fetchPolicy: FetchPolicy.networkOnly,
        )),
        client.query(QueryOptions(
          document: gql(savedPlacesQuery),
          fetchPolicy: FetchPolicy.cacheAndNetwork,
        )),
        client.query(QueryOptions(
          document: gql(servicesQuery),
          variables: const {'regionId': AppConfig.defaultRegionId},
        )),
      ]);
      final flights =
          (results[0].data?['flightTrackings'] as List<dynamic>? ?? [])
              .cast<Map<String, dynamic>>();
      final places =
          (results[1].data?['savedPlaces'] as List<dynamic>? ?? [])
              .cast<Map<String, dynamic>>();
      final svc = (results[2].data?['services'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>();
      final ride = svc.firstWhere(
          (s) => s['serviceType'] == 'RideSharing',
          orElse: () => svc.isNotEmpty ? svc.first : {});
      if (!mounted) return;
      setState(() {
        _items = flights;
        _savedPlaces = places;
        _serviceId = ride['id'] as int?;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _flightDate,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 14)),
    );
    if (picked != null && mounted) setState(() => _flightDate = picked);
  }

  Future<void> _save() async {
    final flightNum = _flightCtrl.text.trim().toUpperCase();
    if (flightNum.length < 3) {
      _toast(tr('flightNumberInvalid'));
      return;
    }
    if (_selectedPlace == null) {
      _toast(tr('pickPickupPlace'));
      return;
    }
    if (_serviceId == null) {
      _toast(tr('noServiceAvailable'));
      return;
    }
    setState(() => _saving = true);
    try {
      final client = await GraphQLClientManager.get();
      final dateStr =
          '${_flightDate.year.toString().padLeft(4, '0')}-${_flightDate.month.toString().padLeft(2, '0')}-${_flightDate.day.toString().padLeft(2, '0')}';
      final res = await client.mutate(MutationOptions(
        document: gql(trackFlightMutation),
        variables: {
          'input': {
            'flightNumber': flightNum,
            'flightDate': dateStr,
            'pickupAddress': _selectedPlace!['address'] as String? ?? '',
            'pickupLat': (_selectedPlace!['lat'] as num).toDouble(),
            'pickupLng': (_selectedPlace!['lng'] as num).toDouble(),
            'serviceId': _serviceId,
            'regionId': AppConfig.defaultRegionId,
          },
        },
      ));
      if (res.hasException) throw res.exception!;
      _flightCtrl.clear();
      if (mounted) {
        _toast(tr('flightTracked'));
        _bootstrap();
      }
    } catch (e) {
      _toast(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _cancel(int id) async {
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(MutationOptions(
        document: gql(cancelFlightTrackingMutation),
        variables: {'id': id},
      ));
      _bootstrap();
    } catch (_) {}
  }

  void _toast(String s) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s)));

  String _formatDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('airportPickup'), style: AuroraText.titleSmall),
      ),
      body: _loading
          ? Center(
              child: CircularProgressIndicator(color: AuroraColors.ember))
          : ListView(
              padding: const EdgeInsets.all(AuroraSpacing.lg),
              children: [
                _form(),
                const SizedBox(height: AuroraSpacing.lg),
                Text(tr('myTrackings'), style: AuroraText.titleSmall),
                const SizedBox(height: AuroraSpacing.sm),
                if (_items.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(AuroraSpacing.lg),
                    child: Center(
                      child: Text(tr('noTrackings'),
                          style: AuroraText.bodySmall),
                    ),
                  )
                else
                  ..._items.map(_card),
              ],
            ),
    );
  }

  Widget _form() {
    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(tr('trackNewFlight'), style: AuroraText.titleSmall),
          const SizedBox(height: AuroraSpacing.sm),
          TextField(
            controller: _flightCtrl,
            textCapitalization: TextCapitalization.characters,
            decoration: InputDecoration(
              hintText: 'SV1234',
              filled: true,
              fillColor: AuroraColors.ash,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AuroraRadius.md),
                borderSide: BorderSide.none,
              ),
              prefixIcon: Icon(Icons.flight, color: AuroraColors.ember),
            ),
            style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
          ),
          const SizedBox(height: AuroraSpacing.sm),
          InkWell(
            onTap: _pickDate,
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
              decoration: BoxDecoration(
                color: AuroraColors.ash,
                borderRadius: BorderRadius.circular(AuroraRadius.md),
              ),
              child: Row(
                children: [
                  Icon(Icons.event, color: AuroraColors.ember),
                  const SizedBox(width: AuroraSpacing.sm),
                  Text(_formatDate(_flightDate),
                      style: AuroraText.bodyMedium
                          .copyWith(color: AuroraColors.pearl)),
                ],
              ),
            ),
          ),
          const SizedBox(height: AuroraSpacing.sm),
          DropdownButtonFormField<Map<String, dynamic>>(
            value: _selectedPlace,
            dropdownColor: AuroraColors.coal,
            style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
            decoration: InputDecoration(
              filled: true,
              fillColor: AuroraColors.ash,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AuroraRadius.md),
                borderSide: BorderSide.none,
              ),
              prefixIcon:
                  Icon(Icons.location_on, color: AuroraColors.ember),
            ),
            hint: Text(tr('pickPickupPlace'),
                style: AuroraText.bodyMedium
                    .copyWith(color: AuroraColors.textSecondary)),
            items: _savedPlaces
                .map((p) => DropdownMenuItem(
                      value: p,
                      child: Text(p['label'] as String? ?? '',
                          overflow: TextOverflow.ellipsis),
                    ))
                .toList(),
            onChanged: (v) => setState(() => _selectedPlace = v),
          ),
          const SizedBox(height: AuroraSpacing.md),
          AuroraButton.primary(
            label: tr('startTracking'),
            icon: Icons.flight_takeoff,
            loading: _saving,
            onPressed: _saving ? null : _save,
          ),
          const SizedBox(height: AuroraSpacing.xs),
          Text(tr('airportLeadHint'),
              textAlign: TextAlign.center,
              style: AuroraText.bodySmall
                  .copyWith(color: AuroraColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _card(Map<String, dynamic> t) {
    final scheduled = t['scheduledArrival'] as String?;
    final status = t['status'] as String? ?? 'tracking';
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Row(
        children: [
          Icon(Icons.flight, color: AuroraColors.ember),
          const SizedBox(width: AuroraSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${t['flightNumber']} · ${t['flightDate']}',
                    style: AuroraText.bodyMedium
                        .copyWith(color: AuroraColors.pearl)),
                if (scheduled != null)
                  Text('ETA: ${scheduled.substring(0, 16).replaceAll('T', ' ')}',
                      style: AuroraText.bodySmall),
                Text('${tr('flight_status')}: ${tr('flight_$status')}',
                    style: AuroraText.bodySmall),
              ],
            ),
          ),
          if (status == 'tracking')
            IconButton(
              icon:
                  Icon(Icons.close, color: AuroraColors.danger),
              onPressed: () => _cancel(t['id'] as int),
            ),
        ],
      ),
    );
  }
}
