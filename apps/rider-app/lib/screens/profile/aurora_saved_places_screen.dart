import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/models/order_model.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../home/widgets/destination_bottom_sheet.dart';

/// شاشة إدارة الأماكن المحفوظة (المنزل/العمل/مفضّلة).
/// تعتمد على savedPlacesQuery / addSavedPlaceMutation / deleteSavedPlaceMutation.
class AuroraSavedPlacesScreen extends StatefulWidget {
  const AuroraSavedPlacesScreen({super.key});

  @override
  State<AuroraSavedPlacesScreen> createState() =>
      _AuroraSavedPlacesScreenState();
}

class _SavedPlace {
  final int id;
  final String label;
  final String address;
  final double lat;
  final double lng;
  final String? type;
  const _SavedPlace(
      this.id, this.label, this.address, this.lat, this.lng, this.type);
}

class _AuroraSavedPlacesScreenState extends State<AuroraSavedPlacesScreen> {
  bool _loading = true;
  bool _busy = false;
  List<_SavedPlace> _places = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(savedPlacesQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final list = (res.data?['savedPlaces'] as List?) ?? [];
      _places = list.map((p) {
        final m = p as Map<String, dynamic>;
        return _SavedPlace(
          m['id'] as int,
          (m['label'] as String?) ?? '',
          (m['address'] as String?) ?? '',
          (m['lat'] as num).toDouble(),
          (m['lng'] as num).toDouble(),
          m['type'] as String?,
        );
      }).toList();
    } catch (_) {
      // تُترك القائمة فارغة عند الفشل
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _delete(_SavedPlace p) async {
    setState(() => _busy = true);
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(MutationOptions(
        document: gql(deleteSavedPlaceMutation),
        variables: {'id': p.id},
      ));
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
    if (mounted) setState(() => _busy = false);
  }

  Future<void> _addFlow() async {
    // 1) اختيار الموقع عبر بحث الوجهة الموجود
    final picked = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const DestinationBottomSheet(originAddress: ''),
    );
    if (picked == null || !mounted) return;
    final point = picked['point'] as GeoPoint?;
    final address = (picked['address'] as String?) ?? '';
    if (point == null) return;

    // 2) اختيار التسمية
    final label = await _askLabel();
    if (label == null || label.trim().isEmpty || !mounted) return;

    // 3) الحفظ
    setState(() => _busy = true);
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(MutationOptions(
        document: gql(addSavedPlaceMutation),
        variables: {
          'input': {
            'label': label.trim(),
            'address': address,
            'lat': point.lat,
            'lng': point.lng,
            'type': _typeForLabel(label.trim()),
          },
        },
      ));
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
    if (mounted) setState(() => _busy = false);
  }

  String _typeForLabel(String label) {
    if (label == tr('placeHome')) return 'home';
    if (label == tr('placeWork')) return 'work';
    return 'other';
  }

  Future<String?> _askLabel() async {
    final ctrl = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.obsidian,
        title: Text(tr('placeLabel'),
            style: AuroraText.titleSmall.copyWith(color: AuroraColors.pearl)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Wrap(
              spacing: AuroraSpacing.sm,
              children: [tr('placeHome'), tr('placeWork')]
                  .map((q) => ActionChip(
                        label: Text(q),
                        onPressed: () => Navigator.pop(ctx, q),
                      ))
                  .toList(),
            ),
            const SizedBox(height: AuroraSpacing.sm),
            TextField(
              controller: ctrl,
              style:
                  AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
              decoration: InputDecoration(
                hintText: tr('placeLabelHint'),
                filled: true,
                fillColor: AuroraColors.coal,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: Text(tr('cancel'))),
          TextButton(
            onPressed: () => Navigator.pop(ctx, ctrl.text),
            child: Text(tr('save')),
          ),
        ],
      ),
    );
  }

  IconData _iconFor(_SavedPlace p) {
    switch (p.type) {
      case 'home':
        return Icons.home_rounded;
      case 'work':
        return Icons.work_rounded;
      default:
        return Icons.bookmark_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(tr('savedPlaces'),
            style: AuroraText.titleMedium.copyWith(color: AuroraColors.pearl)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AuroraColors.ember,
        onPressed: _busy ? null : _addFlow,
        icon: Icon(Icons.add, color: Colors.white),
        label: Text(tr('addPlace'),
            style: const TextStyle(color: Colors.white)),
      ),
      body: AuroraBackground(
        child: SafeArea(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _places.isEmpty
                  ? _empty()
                  : ListView.separated(
                      padding: const EdgeInsets.all(AuroraSpacing.lg),
                      itemCount: _places.length,
                      separatorBuilder: (_, __) =>
                          const SizedBox(height: AuroraSpacing.sm),
                      itemBuilder: (_, i) => _placeTile(_places[i]),
                    ),
        ),
      ),
    );
  }

  Widget _empty() => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.bookmark_border_rounded,
                size: 56, color: AuroraColors.textSecondary),
            const SizedBox(height: AuroraSpacing.sm),
            Text(tr('noSavedPlaces'),
                style: AuroraText.bodyMedium
                    .copyWith(color: AuroraColors.textSecondary)),
          ],
        ),
      );

  Widget _placeTile(_SavedPlace p) {
    return AuroraCard(
      child: Row(
        children: [
          Icon(_iconFor(p), color: AuroraColors.ember),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p.label,
                    style: AuroraText.bodyMedium
                        .copyWith(color: AuroraColors.pearl)),
                if (p.address.isNotEmpty)
                  Text(p.address,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AuroraText.bodySmall
                          .copyWith(color: AuroraColors.textSecondary)),
              ],
            ),
          ),
          IconButton(
            icon: Icon(Icons.delete_outline,
                color: AuroraColors.textSecondary),
            onPressed: _busy ? null : () => _delete(p),
          ),
        ],
      ),
    );
  }
}
