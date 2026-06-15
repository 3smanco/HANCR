import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/payouts_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/theme/aurora_theme.dart';

/// EarningsSummaryStrip — متاح / معلّق / إجمالي مدى الحياة (myEarningsSummary).
class EarningsSummaryStrip extends StatefulWidget {
  const EarningsSummaryStrip({super.key});

  @override
  State<EarningsSummaryStrip> createState() => _EarningsSummaryStripState();
}

class _EarningsSummaryStripState extends State<EarningsSummaryStrip> {
  int? _available;
  int? _pending;
  int? _allTime;
  String _currency = '';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(myEarningsSummaryQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final d = res.data?['myEarningsSummary'] as Map<String, dynamic>?;
      if (!mounted) return;
      setState(() {
        _available = (d?['availableBalance'] as num?)?.toInt();
        _pending = (d?['pendingPayoutAmount'] as num?)?.toInt();
        _allTime = (d?['totalEarnedAllTime'] as num?)?.toInt();
        _currency = d?['currency'] as String? ?? '';
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _allTime == null) {
      return const SizedBox(height: 0);
    }
    return Row(
      children: [
        Expanded(
          child: _cell(Icons.account_balance_wallet_outlined, tr('available'),
              _available ?? 0, AuroraColors.success),
        ),
        const SizedBox(width: AuroraSpacing.sm),
        Expanded(
          child: _cell(Icons.hourglass_bottom, tr('pending'), _pending ?? 0,
              AuroraColors.warning),
        ),
        const SizedBox(width: AuroraSpacing.sm),
        Expanded(
          child: _cell(Icons.trending_up, tr('allTime'), _allTime ?? 0,
              AuroraColors.ember),
        ),
      ],
    );
  }

  Widget _cell(IconData icon, String label, int value, Color color) {
    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(height: AuroraSpacing.sm),
          Text('$value',
              style: AuroraText.titleSmall.copyWith(color: color)),
          Text(_currency,
              style: AuroraText.caption.copyWith(color: AuroraColors.textHint)),
          const SizedBox(height: 2),
          Text(label, style: AuroraText.caption),
        ],
      ),
    );
  }
}
