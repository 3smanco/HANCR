import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/config/app_config.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/carpool_gql.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/motion/motion.dart';

/// شاشة Carpool — يطلب الراكب مشاركة رحلة مع راكب آخر بنفس المسار.
class AuroraCarpoolScreen extends StatefulWidget {
  const AuroraCarpoolScreen({super.key});

  @override
  State<AuroraCarpoolScreen> createState() => _AuroraCarpoolScreenState();
}

class _AuroraCarpoolScreenState extends State<AuroraCarpoolScreen> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  bool _saving = false;
  int? _serviceId;
  List<Map<String, dynamic>> _savedPlaces = [];

  Map<String, dynamic>? _origin;
  Map<String, dynamic>? _destination;
  TimeOfDay _time =
      TimeOfDay(hour: DateTime.now().hour + 1, minute: DateTime.now().minute);
  DateTime _date = DateTime.now();
  int _maxRiders = 3;
  String _trustMode = 'open';

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      final client = await GraphQLClientManager.get();
      final results = await Future.wait([
        client.query(QueryOptions(
          document: gql(carpoolRequestsQuery),
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
      final reqs = (results[0].data?['carpoolRequests'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>();
      final places = (results[1].data?['savedPlaces'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>();
      final svc = (results[2].data?['services'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>();
      final ride = svc.firstWhere(
        (s) => s['serviceType'] == 'RideSharing',
        orElse: () => svc.isNotEmpty ? svc.first : {},
      );
      if (!mounted) return;
      setState(() {
        _items = reqs;
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
      initialDate: _date,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 7)),
    );
    if (picked != null && mounted) setState(() => _date = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(context: context, initialTime: _time);
    if (picked != null && mounted) setState(() => _time = picked);
  }

  Future<void> _submit() async {
    if (_origin == null || _destination == null) {
      _toast(tr('pickOriginAndDest'));
      return;
    }
    if (_serviceId == null) {
      _toast(tr('noServiceAvailable'));
      return;
    }
    final scheduled =
        DateTime(_date.year, _date.month, _date.day, _time.hour, _time.minute);
    if (scheduled.isBefore(DateTime.now().add(const Duration(minutes: 5)))) {
      _toast(tr('carpoolFutureTime'));
      return;
    }
    setState(() => _saving = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(requestCarpoolMutation),
        variables: {
          'input': {
            'originAddress': _origin!['address'],
            'originLat': (_origin!['lat'] as num).toDouble(),
            'originLng': (_origin!['lng'] as num).toDouble(),
            'destinationAddress': _destination!['address'],
            'destinationLat': (_destination!['lat'] as num).toDouble(),
            'destinationLng': (_destination!['lng'] as num).toDouble(),
            'scheduledAt': scheduled.toUtc().toIso8601String(),
            'maxRiders': _maxRiders,
            'trustMode': _trustMode,
            'serviceId': _serviceId,
            'regionId': AppConfig.defaultRegionId,
          },
        },
      ));
      if (res.hasException) throw res.exception!;
      final data = res.data?['requestCarpool'] as Map<String, dynamic>?;
      final status = data?['status'] as String?;
      _toast(status == 'matched' ? tr('carpoolMatched') : tr('carpoolPending'));
      if (mounted) _bootstrap();
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
        document: gql(cancelCarpoolRequestMutation),
        variables: {'id': id},
      ));
      _bootstrap();
    } catch (_) {}
  }

  void _toast(String s) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s)));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('carpool'), style: AuroraText.titleSmall),
      ),
      body: _loading
          ? const Center(child: AuroraLoader(size: 36))
          : ListView(
              padding: const EdgeInsets.all(AuroraSpacing.lg),
              children: [
                _form(),
                const SizedBox(height: AuroraSpacing.lg),
                Text(tr('myCarpoolRequests'), style: AuroraText.titleSmall),
                const SizedBox(height: AuroraSpacing.sm),
                if (_items.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(AuroraSpacing.lg),
                    child: Center(
                      child: Text(tr('noCarpoolRequests'),
                          style: AuroraText.bodySmall),
                    ),
                  )
                else
                  ..._items.map(_reqCard),
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
          Text(tr('carpoolHowItWorks'),
              style: AuroraText.bodySmall
                  .copyWith(color: AuroraColors.textSecondary)),
          const SizedBox(height: AuroraSpacing.md),
          _placeDropdown(
              _origin, (v) => setState(() => _origin = v), tr('from')),
          const SizedBox(height: AuroraSpacing.sm),
          _placeDropdown(
              _destination, (v) => setState(() => _destination = v), tr('to')),
          const SizedBox(height: AuroraSpacing.sm),
          Row(
            children: [
              Expanded(
                child: _pillButton(Icons.event, _formatDate(_date), _pickDate),
              ),
              const SizedBox(width: AuroraSpacing.sm),
              Expanded(
                child: _pillButton(
                    Icons.schedule,
                    '${_time.hour.toString().padLeft(2, '0')}:${_time.minute.toString().padLeft(2, '0')}',
                    _pickTime),
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.md),
          Text(tr('maxRiders'), style: AuroraText.bodySmall),
          Wrap(
            spacing: 6,
            children: [2, 3, 4]
                .map((n) => ChoiceChip(
                      label: Text('$n'),
                      selected: _maxRiders == n,
                      onSelected: (_) => setState(() => _maxRiders = n),
                    ))
                .toList(),
          ),
          const SizedBox(height: AuroraSpacing.md),
          Text(tr('trustMode'), style: AuroraText.bodySmall),
          Wrap(
            spacing: 6,
            children: const ['open', 'women_only', 'family']
                .map((t) => ChoiceChip(
                      label: Text(tr('trust_$t')),
                      selected: _trustMode == t,
                      onSelected: (_) => setState(() => _trustMode = t),
                    ))
                .toList(),
          ),
          const SizedBox(height: AuroraSpacing.lg),
          AuroraButton.primary(
            label: tr('requestCarpool'),
            icon: Icons.group_add,
            loading: _saving,
            onPressed: _saving ? null : _submit,
          ),
        ],
      ),
    );
  }

  Widget _placeDropdown(Map<String, dynamic>? value,
      ValueChanged<Map<String, dynamic>?> onChanged, String hint) {
    return DropdownButtonFormField<Map<String, dynamic>>(
      initialValue: value,
      dropdownColor: AuroraColors.coal,
      style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
      decoration: InputDecoration(
        filled: true,
        fillColor: AuroraColors.ash,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          borderSide: BorderSide.none,
        ),
        prefixIcon: Icon(Icons.place, color: AuroraColors.ember),
      ),
      hint: Text(hint,
          style: AuroraText.bodyMedium
              .copyWith(color: AuroraColors.textSecondary)),
      items: _savedPlaces
          .map((p) => DropdownMenuItem(
                value: p,
                child: Text(p['label'] as String? ?? '',
                    overflow: TextOverflow.ellipsis),
              ))
          .toList(),
      onChanged: onChanged,
    );
  }

  Widget _pillButton(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AuroraRadius.md),
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
        decoration: BoxDecoration(
          color: AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.md),
        ),
        child: Row(
          children: [
            Icon(icon, color: AuroraColors.ember, size: 18),
            const SizedBox(width: AuroraSpacing.sm),
            Text(label,
                style:
                    AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl)),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Widget _reqCard(Map<String, dynamic> r) {
    final status = r['status'] as String? ?? 'pending';
    final discount = (r['discountPercent'] as num?)?.toDouble() ?? 0;
    final scheduled = (r['scheduledAt'] as String?)?.substring(0, 16) ?? '';
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(
          color:
              status == 'matched' ? AuroraColors.success : AuroraColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.group, color: AuroraColors.ember, size: 18),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  scheduled.replaceAll('T', ' '),
                  style:
                      AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
                ),
              ),
              Text(tr('carpool_status_$status'),
                  style: AuroraText.bodySmall.copyWith(
                    color: status == 'matched'
                        ? AuroraColors.success
                        : AuroraColors.textSecondary,
                  )),
            ],
          ),
          const SizedBox(height: 4),
          Text('${r['originAddress']} → ${r['destinationAddress']}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AuroraText.bodySmall),
          if (discount > 0)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                  '${tr('discountApplied')}: ${(discount * 100).round()}%',
                  style: AuroraText.bodySmall
                      .copyWith(color: AuroraColors.success)),
            ),
          if (status == 'pending' || status == 'matched')
            Align(
              alignment: AlignmentDirectional.centerEnd,
              child: TextButton(
                onPressed: () => _cancel(r['id'] as int),
                child: Text(tr('cancel'),
                    style: TextStyle(color: AuroraColors.danger)),
              ),
            ),
        ],
      ),
    );
  }
}
