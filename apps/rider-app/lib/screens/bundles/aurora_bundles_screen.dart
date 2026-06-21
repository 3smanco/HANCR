import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/config/app_config.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/bundle_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
 import '../../core/motion/motion.dart';

/// F1 — Ride Bundles: تصفّح + شراء + متابعة الحزم.
class AuroraBundlesScreen extends StatefulWidget {
  const AuroraBundlesScreen({super.key});

  @override
  State<AuroraBundlesScreen> createState() => _AuroraBundlesScreenState();
}

class _AuroraBundlesScreenState extends State<AuroraBundlesScreen> {
  List<Map<String, dynamic>> _available = [];
  List<Map<String, dynamic>> _mine = [];
  bool _loading = true;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await Future.wait([
        client.query(QueryOptions(
          document: gql(availableBundlesQuery),
          variables: const {'regionId': AppConfig.defaultRegionId},
          fetchPolicy: FetchPolicy.networkOnly,
        )),
        client.query(QueryOptions(
          document: gql(myEntitlementsQuery),
          fetchPolicy: FetchPolicy.networkOnly,
        )),
      ]);
      final available =
          (res[0].data?['availableBundles'] as List<dynamic>? ?? [])
              .cast<Map<String, dynamic>>();
      final mine = (res[1].data?['myEntitlements'] as List<dynamic>? ?? [])
          .cast<Map<String, dynamic>>();
      if (!mounted) return;
      setState(() {
        _available = available;
        _mine = mine;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _purchase(Map<String, dynamic> bundle) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('bundleConfirmTitle'),
            style: AuroraText.titleSmall),
        content: Text(
          '${bundle['name']}\n${bundle['ridesCount']} × ${tr('bundleRidesCount')} — ${bundle['price']} ${bundle['currency']}\n${tr('bundleConfirmBody')}',
          style: AuroraText.bodyMedium,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(tr('cancel')),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AuroraColors.ember,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(tr('buyBundle')),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _busy = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(purchaseBundleMutation),
        variables: {'bundleId': bundle['id']},
      ));
      if (res.hasException) throw res.exception!;
      _toast(tr('bundlePurchased'));
      await _bootstrap();
    } catch (e) {
      final msg = e.toString();
      _toast(msg.contains('Insufficient')
          ? tr('insufficientWallet')
          : msg.replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _toast(String s) => ScaffoldMessenger.of(context)
      .showSnackBar(SnackBar(content: Text(s)));

  String _fmtDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  String _statusText(String s) {
    switch (s) {
      case 'active':
        return tr('bundleStatusActive');
      case 'exhausted':
        return tr('bundleStatusExhausted');
      case 'expired':
        return tr('bundleStatusExpired');
      default:
        return s;
    }
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'active':
        return Colors.greenAccent;
      case 'exhausted':
        return Colors.orangeAccent;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('rideBundles'), style: AuroraText.titleSmall),
      ),
      body: _loading
          ? Center(
              child: AuroraLoader(size: 36))
          : RefreshIndicator(
              onRefresh: _bootstrap,
              color: AuroraColors.ember,
              child: ListView(
                padding: const EdgeInsets.all(AuroraSpacing.lg),
                children: [
                  Text(tr('bundlesHint'),
                      style: AuroraText.bodySmall
                          .copyWith(color: AuroraColors.textSecondary)),
                  const SizedBox(height: AuroraSpacing.lg),
                  if (_mine.isNotEmpty) ...[
                    Text(tr('myBundles'), style: AuroraText.titleSmall),
                    const SizedBox(height: AuroraSpacing.sm),
                    ..._mine.map(_entCard),
                    const SizedBox(height: AuroraSpacing.lg),
                  ],
                  Text(tr('availableBundles'),
                      style: AuroraText.titleSmall),
                  const SizedBox(height: AuroraSpacing.sm),
                  if (_available.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(AuroraSpacing.lg),
                      child: Center(
                          child: Text(tr('noBundlesYet'),
                              style: AuroraText.bodySmall)),
                    )
                  else
                    ..._available.map(_bundleCard),
                ],
              ),
            ),
    );
  }

  Widget _bundleCard(Map<String, dynamic> b) {
    final maxKm = (b['maxDistanceKm'] as num?)?.toDouble() ?? 0;
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text('${b['name']}',
                    style: AuroraText.titleSmall),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AuroraColors.ember,
                  borderRadius: BorderRadius.circular(AuroraRadius.sm),
                ),
                child: Text(
                  '${b['price']} ${b['currency']}',
                  style: AuroraText.bodySmall
                      .copyWith(color: Colors.white),
                ),
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.xs),
          Text(
            '${b['ridesCount']} ${tr('bundleRidesCount')} · ${b['validityDays']} ${tr('day')}',
            style: AuroraText.bodySmall.copyWith(color: AuroraColors.textSecondary),
          ),
          Text(
            '${tr('bundleMaxDistance')}: ${maxKm == 0 ? tr('bundleUnlimited') : '$maxKm km'}',
            style: AuroraText.bodySmall.copyWith(color: AuroraColors.textSecondary),
          ),
          const SizedBox(height: AuroraSpacing.sm),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AuroraColors.ember,
                foregroundColor: Colors.white,
              ),
              onPressed: _busy ? null : () => _purchase(b),
              child: Text(tr('buyBundle')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _entCard(Map<String, dynamic> e) {
    final exp = DateTime.tryParse(e['expiresAt'] as String? ?? '');
    final status = (e['status'] as String?) ?? 'active';
    final maxKm = (e['maxDistanceKm'] as num?)?.toDouble() ?? 0;
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text('${e['bundleName']}',
                    style: AuroraText.titleSmall),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor(status).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(AuroraRadius.sm),
                ),
                child: Text(_statusText(status),
                    style: AuroraText.bodySmall
                        .copyWith(color: _statusColor(status))),
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.xs),
          Text(
            '${tr('bundleRidesRemaining')}: ${e['ridesRemaining']} / ${e['ridesTotal']}',
            style: AuroraText.bodyMedium,
          ),
          Text(
            '${tr('bundleMaxDistance')}: ${maxKm == 0 ? tr('bundleUnlimited') : '$maxKm km'}',
            style: AuroraText.bodySmall.copyWith(color: AuroraColors.textSecondary),
          ),
          if (exp != null)
            Text(
              '${tr('bundleExpiresOn')}: ${_fmtDate(exp)}',
              style: AuroraText.bodySmall.copyWith(color: AuroraColors.textSecondary),
            ),
        ],
      ),
    );
  }
}
