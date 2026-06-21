import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:intl/intl.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/order_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/motion/motion.dart';

/// AuroraTripHistoryScreen — سجل رحلات السائق المكتملة (completedOrders).
class AuroraTripHistoryScreen extends StatefulWidget {
  const AuroraTripHistoryScreen({super.key});

  @override
  State<AuroraTripHistoryScreen> createState() =>
      _AuroraTripHistoryScreenState();
}

class _AuroraTripHistoryScreenState extends State<AuroraTripHistoryScreen> {
  final List<Map<String, dynamic>> _orders = [];
  bool _loading = true;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(completedOrdersQuery),
        variables: {'limit': 20, 'offset': _orders.length},
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final list = ((res.data?['completedOrders'] as List<dynamic>?) ?? [])
          .cast<Map<String, dynamic>>();
      if (!mounted) return;
      setState(() {
        _orders.addAll(list);
        _hasMore = list.length == 20;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('tripHistory'), style: AuroraText.titleSmall),
        iconTheme: const IconThemeData(color: Color(0xFFFFF5EE)),
      ),
      body: AuroraBackground(
        child: SafeArea(
          child: _loading && _orders.isEmpty
              ? const Center(child: AuroraLoader(size: 40))
              : _orders.isEmpty
                  ? _empty()
                  : ListView.separated(
                      padding: const EdgeInsets.all(AuroraSpacing.lg),
                      itemCount: _orders.length + (_hasMore ? 1 : 0),
                      separatorBuilder: (_, _) =>
                          const SizedBox(height: AuroraSpacing.sm),
                      itemBuilder: (ctx, i) {
                        if (i >= _orders.length) {
                          _load();
                          return const Padding(
                            padding: EdgeInsets.all(AuroraSpacing.md),
                            child: Center(child: AuroraLoader(size: 28)),
                          );
                        }
                        return _tripCard(_orders[i]).fadeSlideIn(index: i);
                      },
                    ),
        ),
      ),
    );
  }

  Widget _empty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.history, size: 56, color: AuroraColors.textHint),
          const SizedBox(height: AuroraSpacing.md),
          Text(tr('noTrips'), style: AuroraText.bodyMedium),
        ],
      ),
    );
  }

  Widget _tripCard(Map<String, dynamic> o) {
    final addresses = (o['addresses'] as List<dynamic>?) ?? const [];
    final origin = addresses.isNotEmpty ? '${addresses.first}' : '—';
    final dest = addresses.length > 1 ? '${addresses.last}' : '—';
    final cost = (o['costAfterCoupon'] as num?)?.toDouble() ??
        (o['costBest'] as num?)?.toDouble() ??
        0;
    final currency = o['currency'] as String? ?? '';
    final dist = (o['distanceBest'] as num?)?.toDouble() ?? 0;
    final createdOn = o['createdOn'] as String?;
    final date = createdOn != null
        ? DateFormat('d MMM • HH:mm', 'ar').format(DateTime.parse(createdOn))
        : '';

    return AuroraCard(
      padding: const EdgeInsets.all(AuroraSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.check_circle,
                  color: AuroraColors.success, size: 16),
              const SizedBox(width: 6),
              Text(date, style: AuroraText.caption),
              const Spacer(),
              Text('${cost.toStringAsFixed(2)} $currency',
                  style: AuroraText.titleSmall
                      .copyWith(color: AuroraColors.ember)),
            ],
          ),
          const SizedBox(height: AuroraSpacing.sm),
          _addrRow(Icons.trip_origin, origin, AuroraColors.success),
          const SizedBox(height: 4),
          _addrRow(Icons.place, dest, AuroraColors.ember),
          if (dist > 0) ...[
            const SizedBox(height: AuroraSpacing.sm),
            Text('${(dist / 1000).toStringAsFixed(1)} km',
                style: AuroraText.caption
                    .copyWith(color: AuroraColors.textHint)),
          ],
        ],
      ),
    );
  }

  Widget _addrRow(IconData icon, String text, Color color) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: color, size: 14),
        const SizedBox(width: 6),
        Expanded(
          child: Text(text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AuroraText.bodySmall),
        ),
      ],
    );
  }
}
