import 'dart:async';
import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';

import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/order_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/theme/aurora_theme.dart';

/// DriverBidsScreen — المزايدات المفتوحة + تقديم عرض سعر.
class DriverBidsScreen extends StatefulWidget {
  const DriverBidsScreen({super.key});
  @override
  State<DriverBidsScreen> createState() => _DriverBidsScreenState();
}

class _DriverBidsScreenState extends State<DriverBidsScreen> {
  Timer? _poll;
  List<Map<String, dynamic>> _bids = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
    _poll = Timer.periodic(const Duration(seconds: 4), (_) => _fetch());
  }

  Future<void> _fetch() async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(availableBidsQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (!mounted) return;
      setState(() {
        _bids = ((res.data?['availableBids'] as List<dynamic>?) ?? [])
            .cast<Map<String, dynamic>>();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submit(Map<String, dynamic> bid) async {
    final ctrl = TextEditingController(
        text: '${(bid['riderProposedPrice'] as num?)?.toStringAsFixed(0) ?? ''}');
    final price = await showDialog<double>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.ash,
        title: Text(tr('yourOffer'),
            style: const TextStyle(color: AuroraColors.pearl)),
        content: TextField(
          controller: ctrl,
          keyboardType: TextInputType.number,
          autofocus: true,
          style: const TextStyle(color: AuroraColors.pearl),
          decoration: InputDecoration(
            suffixText: bid['currency'] as String? ?? '',
            suffixStyle: const TextStyle(color: AuroraColors.textSecondary),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(tr('cancel'),
                style: const TextStyle(color: AuroraColors.textSecondary)),
          ),
          TextButton(
            onPressed: () =>
                Navigator.pop(ctx, double.tryParse(ctrl.text.trim())),
            child: Text(tr('send'),
                style: const TextStyle(color: AuroraColors.ember)),
          ),
        ],
      ),
    );
    if (price == null || price < 1) return;
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(submitBidOfferMutation),
        variables: {'bidId': bid['id'], 'offeredPrice': price},
      ));
      if (res.hasException) throw res.exception!;
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(tr('offerSent')),
            backgroundColor: AuroraColors.success),
      );
      _fetch();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$e'), backgroundColor: AuroraColors.danger),
        );
      }
    }
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        iconTheme: const IconThemeData(color: AuroraColors.pearl),
        title: Text(tr('availableBids'),
            style: const TextStyle(
                color: AuroraColors.pearl, fontWeight: FontWeight.w700)),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AuroraColors.ember))
          : _bids.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.gavel,
                          color: AuroraColors.textSecondary, size: 56),
                      const SizedBox(height: 12),
                      Text(tr('noBids'),
                          style: const TextStyle(
                              color: AuroraColors.textSecondary)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: AuroraColors.ember,
                  backgroundColor: AuroraColors.ash,
                  onRefresh: _fetch,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _bids.length,
                    itemBuilder: (_, i) => _bidCard(_bids[i]),
                  ),
                ),
    );
  }

  Widget _bidCard(Map<String, dynamic> b) {
    final price = (b['riderProposedPrice'] as num?)?.toDouble() ?? 0;
    final cur = b['currency'] as String? ?? '';
    final dist = ((b['estimatedDistance'] as num?)?.toDouble() ?? 0) / 1000;
    final offered = b['alreadyOffered'] == true;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.my_location,
                  color: AuroraColors.success, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(b['originAddress'] as String? ?? '—',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: AuroraColors.pearl, fontSize: 13)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.location_on, color: AuroraColors.ember, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text(b['destinationAddress'] as String? ?? '—',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: AuroraColors.pearl, fontSize: 13)),
              ),
            ],
          ),
          const Divider(color: AuroraColors.border, height: 18),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${tr('riderProposed')} • ${dist.toStringAsFixed(1)} كم',
                        style: const TextStyle(
                            color: AuroraColors.textSecondary, fontSize: 11)),
                    Text('${price.toStringAsFixed(0)} $cur',
                        style: const TextStyle(
                            color: AuroraColors.ember,
                            fontWeight: FontWeight.w800,
                            fontSize: 18)),
                  ],
                ),
              ),
              if (offered)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AuroraColors.successBg,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(tr('offered'),
                      style: const TextStyle(
                          color: AuroraColors.success,
                          fontWeight: FontWeight.w700,
                          fontSize: 12)),
                )
              else
                GestureDetector(
                  onTap: () => _submit(b),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                    decoration: BoxDecoration(
                      gradient: AuroraColors.emberGradient,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(tr('submitOffer'),
                        style: const TextStyle(
                            color: AuroraColors.pearl,
                            fontWeight: FontWeight.w700,
                            fontSize: 13)),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
