import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/config/app_config.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/commuter_gql.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
 import '../../core/motion/motion.dart';

/// شاشة إنشاء اشتراك Commuter — تختار المنزل والعمل والتوقيتات والأيام.
class AuroraCommuterSetupScreen extends StatefulWidget {
  /// 'commuter' (default) | 'school' | 'campus' | 'medical'
  final String subscriptionType;
  const AuroraCommuterSetupScreen({
    super.key,
    this.subscriptionType = 'commuter',
  });

  @override
  State<AuroraCommuterSetupScreen> createState() =>
      _AuroraCommuterSetupScreenState();
}

class _AuroraCommuterSetupScreenState
    extends State<AuroraCommuterSetupScreen> {
  // المنزل والعمل
  LatLng? _home;
  String _homeAddr = '';
  LatLng? _work;
  String _workAddr = '';

  // الاتجاهات
  bool _doOutbound = true;
  bool _doReturn = true;
  TimeOfDay _outbound = const TimeOfDay(hour: 7, minute: 30);
  TimeOfDay _return = const TimeOfDay(hour: 17, minute: 0);

  // الأيام (0..6 الأحد..السبت). افتراضي: الأحد→الخميس (دوام الخليج)
  final Set<int> _days = {0, 1, 2, 3, 4};

  String _plan = 'daily';
  int? _serviceId; // أول خدمة RideSharing
  bool _saving = false;

  // الحقول الخاصة بالأنواع (School / Medical)
  final _childNameCtrl = TextEditingController();
  final _parentPhoneCtrl = TextEditingController();
  final _medicalNotesCtrl = TextEditingController();
  bool _wheelchair = false;
  String _recurrence = 'daily'; // daily | weekly | biweekly | monthly
  bool _loadingPlaces = true;
  List<Map<String, dynamic>> _savedPlaces = [];

  @override
  void initState() {
    super.initState();
    _recurrence = widget.subscriptionType == 'medical' ? 'weekly' : 'daily';
    _bootstrap();
  }

  @override
  void dispose() {
    _childNameCtrl.dispose();
    _parentPhoneCtrl.dispose();
    _medicalNotesCtrl.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    try {
      final client = await GraphQLClientManager.get();
      // الأماكن المحفوظة + الخدمات
      final res = await client.query(QueryOptions(
        document: gql(savedPlacesQuery),
        fetchPolicy: FetchPolicy.cacheAndNetwork,
      ));
      final list = (res.data?['savedPlaces'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>();
      // ملء افتراضي
      Map<String, dynamic>? home;
      Map<String, dynamic>? work;
      for (final p in list) {
        if (p['type'] == 'home' && home == null) home = p;
        if (p['type'] == 'work' && work == null) work = p;
      }
      final svc = await client.query(QueryOptions(
        document: gql(servicesQuery),
        variables: const {'regionId': AppConfig.defaultRegionId},
      ));
      final services = (svc.data?['services'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>();
      final ride =
          services.firstWhere((s) => s['serviceType'] == 'RideSharing',
              orElse: () => services.isNotEmpty ? services.first : {});
      if (!mounted) return;
      setState(() {
        _savedPlaces = list;
        if (home != null) {
          _home = LatLng((home['lat'] as num).toDouble(),
              (home['lng'] as num).toDouble());
          _homeAddr = home['address'] as String? ?? '';
        }
        if (work != null) {
          _work = LatLng((work['lat'] as num).toDouble(),
              (work['lng'] as num).toDouble());
          _workAddr = work['address'] as String? ?? '';
        }
        _serviceId = ride['id'] as int?;
        _loadingPlaces = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingPlaces = false);
    }
  }

  Future<void> _pickPlace(bool isHome) async {
    final chosen = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      backgroundColor: AuroraColors.coal,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AuroraRadius.xl)),
      ),
      builder: (ctx) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.all(AuroraSpacing.md),
          children: [
            Text(isHome ? tr('chooseHome') : tr('chooseWork'),
                style: AuroraText.titleSmall),
            const SizedBox(height: AuroraSpacing.sm),
            if (_savedPlaces.isEmpty)
              Padding(
                padding: const EdgeInsets.all(AuroraSpacing.md),
                child: Text(tr('noSavedPlaces'),
                    style: AuroraText.bodySmall),
              )
            else
              ..._savedPlaces.map((p) => ListTile(
                    leading: Icon(Icons.bookmark,
                        color: AuroraColors.ember),
                    title: Text(p['label'] as String? ?? '',
                        style: AuroraText.bodyMedium
                            .copyWith(color: AuroraColors.pearl)),
                    subtitle: Text(p['address'] as String? ?? '',
                        style: AuroraText.bodySmall),
                    onTap: () => Navigator.pop(ctx, p),
                  )),
          ],
        ),
      ),
    );
    if (chosen == null || !mounted) return;
    setState(() {
      if (isHome) {
        _home = LatLng((chosen['lat'] as num).toDouble(),
            (chosen['lng'] as num).toDouble());
        _homeAddr = chosen['address'] as String? ?? '';
      } else {
        _work = LatLng((chosen['lat'] as num).toDouble(),
            (chosen['lng'] as num).toDouble());
        _workAddr = chosen['address'] as String? ?? '';
      }
    });
  }

  Future<void> _pickTime(bool isOutbound) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isOutbound ? _outbound : _return,
    );
    if (picked == null || !mounted) return;
    setState(() {
      if (isOutbound) {
        _outbound = picked;
      } else {
        _return = picked;
      }
    });
  }

  String _hhmm(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  Future<void> _save() async {
    if (_home == null || _work == null) {
      _toast(tr('pickHomeAndWork'));
      return;
    }
    if (!_doOutbound && !_doReturn) {
      _toast(tr('pickAtLeastOneLeg'));
      return;
    }
    if (_days.isEmpty) {
      _toast(tr('pickAtLeastOneDay'));
      return;
    }
    if (_serviceId == null) {
      _toast(tr('noServiceAvailable'));
      return;
    }
    setState(() => _saving = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(createCommuterSubscriptionMutation),
        variables: {
          'input': {
            'homeAddress': _homeAddr,
            'homeLat': _home!.latitude,
            'homeLng': _home!.longitude,
            'workAddress': _workAddr,
            'workLat': _work!.latitude,
            'workLng': _work!.longitude,
            if (_doOutbound) 'outboundTime': _hhmm(_outbound),
            if (_doReturn) 'returnTime': _hhmm(_return),
            'daysOfWeek': _days.toList()..sort(),
            'planType': _plan,
            'serviceId': _serviceId,
            'regionId': AppConfig.defaultRegionId,
            'leadMinutes': 10,
            'subscriptionType': widget.subscriptionType,
            if (widget.subscriptionType == 'school' ||
                widget.subscriptionType == 'campus') ...{
              if (_childNameCtrl.text.trim().isNotEmpty)
                'childName': _childNameCtrl.text.trim(),
              if (_parentPhoneCtrl.text.trim().isNotEmpty)
                'parentPhone': _parentPhoneCtrl.text.trim(),
            },
            if (widget.subscriptionType == 'medical') ...{
              if (_medicalNotesCtrl.text.trim().isNotEmpty)
                'medicalNotes': _medicalNotesCtrl.text.trim(),
              'wheelchairNeeded': _wheelchair,
              'recurrence': _recurrence,
            },
          },
        },
      ));
      if (res.hasException) throw res.exception!;
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      _toast(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('createCommuter'), style: AuroraText.titleSmall),
      ),
      body: _loadingPlaces
          ? Center(
              child: AuroraLoader(size: 36))
          : ListView(
              padding: const EdgeInsets.all(AuroraSpacing.lg),
              children: [
                Text(tr('locations'), style: AuroraText.titleSmall),
                const SizedBox(height: AuroraSpacing.sm),
                _locationTile(
                  Icons.home_outlined,
                  AuroraColors.success,
                  tr('home'),
                  _homeAddr.isEmpty ? tr('pickPlace') : _homeAddr,
                  () => _pickPlace(true),
                ),
                const SizedBox(height: AuroraSpacing.sm),
                _locationTile(
                  Icons.work_outline,
                  AuroraColors.ember,
                  tr('work'),
                  _workAddr.isEmpty ? tr('pickPlace') : _workAddr,
                  () => _pickPlace(false),
                ),
                const SizedBox(height: AuroraSpacing.lg),

                // حقول خاصة بنوع الاشتراك
                if (widget.subscriptionType == 'school' ||
                    widget.subscriptionType == 'campus') ...[
                  Text(tr('childInfo'), style: AuroraText.titleSmall),
                  const SizedBox(height: AuroraSpacing.sm),
                  TextField(
                    controller: _childNameCtrl,
                    style: AuroraText.bodyMedium
                        .copyWith(color: AuroraColors.pearl),
                    decoration: InputDecoration(
                      hintText: tr('childName'),
                      filled: true,
                      fillColor: AuroraColors.coal,
                      border: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(AuroraRadius.md),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: AuroraSpacing.sm),
                  TextField(
                    controller: _parentPhoneCtrl,
                    keyboardType: TextInputType.phone,
                    style: AuroraText.bodyMedium
                        .copyWith(color: AuroraColors.pearl),
                    decoration: InputDecoration(
                      hintText: tr('parentPhone'),
                      filled: true,
                      fillColor: AuroraColors.coal,
                      border: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(AuroraRadius.md),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: AuroraSpacing.lg),
                ],

                if (widget.subscriptionType == 'medical') ...[
                  Text(tr('medicalInfo'), style: AuroraText.titleSmall),
                  const SizedBox(height: AuroraSpacing.sm),
                  TextField(
                    controller: _medicalNotesCtrl,
                    maxLines: 3,
                    style: AuroraText.bodyMedium
                        .copyWith(color: AuroraColors.pearl),
                    decoration: InputDecoration(
                      hintText: tr('medicalNotesHint'),
                      filled: true,
                      fillColor: AuroraColors.coal,
                      border: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(AuroraRadius.md),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: AuroraSpacing.sm),
                  SwitchListTile(
                    value: _wheelchair,
                    onChanged: (v) => setState(() => _wheelchair = v),
                    activeColor: AuroraColors.ember,
                    title: Text(tr('wheelchairNeeded'),
                        style: AuroraText.bodyMedium
                            .copyWith(color: AuroraColors.pearl)),
                  ),
                  const SizedBox(height: AuroraSpacing.sm),
                  Text(tr('recurrence'), style: AuroraText.bodySmall),
                  const SizedBox(height: AuroraSpacing.xs),
                  Wrap(
                    spacing: 6,
                    children: const ['daily', 'weekly', 'biweekly', 'monthly']
                        .map((r) => ChoiceChip(
                              label: Text(tr('recur_$r')),
                              selected: _recurrence == r,
                              onSelected: (_) =>
                                  setState(() => _recurrence = r),
                            ))
                        .toList(),
                  ),
                  const SizedBox(height: AuroraSpacing.lg),
                ],

                Text(tr('legsAndTimes'), style: AuroraText.titleSmall),
                const SizedBox(height: AuroraSpacing.sm),
                _legRow(
                  selected: _doOutbound,
                  onChanged: (v) => setState(() => _doOutbound = v),
                  icon: Icons.arrow_forward,
                  label: tr('outbound'),
                  time: _outbound,
                  onTime: () => _pickTime(true),
                ),
                const SizedBox(height: AuroraSpacing.sm),
                _legRow(
                  selected: _doReturn,
                  onChanged: (v) => setState(() => _doReturn = v),
                  icon: Icons.arrow_back,
                  label: tr('returnLeg'),
                  time: _return,
                  onTime: () => _pickTime(false),
                ),
                const SizedBox(height: AuroraSpacing.lg),

                Text(tr('daysOfWeek'), style: AuroraText.titleSmall),
                const SizedBox(height: AuroraSpacing.sm),
                Wrap(
                  spacing: 6,
                  children: List.generate(7, (i) {
                    final names = [
                      tr('daySun'),
                      tr('dayMon'),
                      tr('dayTue'),
                      tr('dayWed'),
                      tr('dayThu'),
                      tr('dayFri'),
                      tr('daySat'),
                    ];
                    final sel = _days.contains(i);
                    return ChoiceChip(
                      label: Text(names[i]),
                      selected: sel,
                      onSelected: (s) => setState(() {
                        if (s) {
                          _days.add(i);
                        } else {
                          _days.remove(i);
                        }
                      }),
                    );
                  }),
                ),
                const SizedBox(height: AuroraSpacing.lg),

                Text(tr('planType'), style: AuroraText.titleSmall),
                const SizedBox(height: AuroraSpacing.sm),
                Row(
                  children: [
                    Expanded(
                      child: ChoiceChip(
                        label: Text(tr('plan_daily')),
                        selected: _plan == 'daily',
                        onSelected: (_) => setState(() => _plan = 'daily'),
                      ),
                    ),
                    const SizedBox(width: AuroraSpacing.sm),
                    Expanded(
                      child: ChoiceChip(
                        label: Text(tr('plan_monthly')),
                        selected: _plan == 'monthly',
                        onSelected: (_) => setState(() => _plan = 'monthly'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AuroraSpacing.xl),

                AuroraButton.primary(
                  label: tr('save'),
                  icon: Icons.check,
                  loading: _saving,
                  onPressed: _saving ? null : _save,
                ),
                const SizedBox(height: AuroraSpacing.md),
                Text(
                  tr('commuterLeadHint'),
                  textAlign: TextAlign.center,
                  style: AuroraText.bodySmall.copyWith(
                    color: AuroraColors.textSecondary,
                  ),
                ),
              ],
            ),
    );
  }

  Widget _locationTile(IconData icon, Color color, String title,
      String subtitle, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AuroraRadius.md),
      child: Container(
        padding: const EdgeInsets.all(AuroraSpacing.md),
        decoration: BoxDecoration(
          color: AuroraColors.coal,
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          border: Border.all(color: AuroraColors.border),
        ),
        child: Row(
          children: [
            Icon(icon, color: color),
            const SizedBox(width: AuroraSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AuroraText.bodySmall),
                  Text(subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AuroraText.bodyMedium
                          .copyWith(color: AuroraColors.pearl)),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: AuroraColors.textSecondary),
          ],
        ),
      ),
    );
  }

  Widget _legRow({
    required bool selected,
    required ValueChanged<bool> onChanged,
    required IconData icon,
    required String label,
    required TimeOfDay time,
    required VoidCallback onTime,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(
          color: selected ? AuroraColors.ember : AuroraColors.border,
        ),
      ),
      child: Row(
        children: [
          Switch(
            value: selected,
            activeColor: AuroraColors.ember,
            onChanged: onChanged,
          ),
          Icon(icon, color: AuroraColors.ember, size: 18),
          const SizedBox(width: AuroraSpacing.sm),
          Expanded(
            child: Text(label,
                style:
                    AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl)),
          ),
          TextButton(
            onPressed: selected ? onTime : null,
            child: Text(_hhmm(time),
                style: AuroraText.titleSmall
                    .copyWith(color: AuroraColors.ember)),
          ),
        ],
      ),
    );
  }
}
