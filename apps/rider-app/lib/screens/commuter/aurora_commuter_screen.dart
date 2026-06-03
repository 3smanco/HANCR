import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/commuter_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import 'aurora_commuter_setup_screen.dart';

/// شاشة اشتراكات Commuter — قائمة الاشتراكات النشطة + زر إضافة.
class AuroraCommuterScreen extends StatefulWidget {
  const AuroraCommuterScreen({super.key});

  @override
  State<AuroraCommuterScreen> createState() => _AuroraCommuterScreenState();
}

class _AuroraCommuterScreenState extends State<AuroraCommuterScreen> {
  List<Map<String, dynamic>> _subs = [];
  bool _loading = true;

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
        document: gql(commuterSubscriptionsQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final list =
          (res.data?['commuterSubscriptions'] as List<dynamic>?) ?? [];
      if (!mounted) return;
      setState(() {
        _subs = list.map((e) => e as Map<String, dynamic>).toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleActive(int id, bool active) async {
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(MutationOptions(
        document: gql(updateCommuterSubscriptionMutation),
        variables: {'id': id, 'input': {'active': active}},
      ));
      _load();
    } catch (_) {}
  }

  Future<void> _delete(int id) async {
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(MutationOptions(
        document: gql(deleteCommuterSubscriptionMutation),
        variables: {'id': id},
      ));
      _load();
    } catch (_) {}
  }

  Future<void> _openSetup() async {
    final created = await Navigator.of(context).push<bool>(MaterialPageRoute(
      builder: (_) => const AuroraCommuterSetupScreen(),
    ));
    if (created == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('commuter'), style: AuroraText.titleSmall),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: AuroraColors.ember),
            onPressed: _openSetup,
          ),
        ],
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AuroraColors.ember))
          : _subs.isEmpty
              ? _empty()
              : RefreshIndicator(
                  color: AuroraColors.ember,
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(AuroraSpacing.lg),
                    itemCount: _subs.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: AuroraSpacing.md),
                    itemBuilder: (_, i) => _subCard(_subs[i]),
                  ),
                ),
    );
  }

  Widget _empty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AuroraSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.commute,
                size: 64, color: AuroraColors.textSecondary),
            const SizedBox(height: AuroraSpacing.md),
            Text(tr('commuterEmpty'),
                textAlign: TextAlign.center,
                style: AuroraText.titleSmall),
            const SizedBox(height: AuroraSpacing.sm),
            Text(tr('commuterEmptyHint'),
                textAlign: TextAlign.center,
                style: AuroraText.bodySmall),
            const SizedBox(height: AuroraSpacing.lg),
            AuroraButton.primary(
              label: tr('createCommuter'),
              icon: Icons.add,
              fullWidth: false,
              onPressed: _openSetup,
            ),
          ],
        ),
      ),
    );
  }

  Widget _subCard(Map<String, dynamic> s) {
    final active = s['active'] as bool? ?? false;
    final days = (s['daysOfWeek'] as List<dynamic>? ?? []).cast<int>();
    final outbound = s['outboundTime'] as String?;
    final returnT = s['returnTime'] as String?;
    final planType = s['planType'] as String? ?? 'daily';

    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(
          color: active ? AuroraColors.ember : AuroraColors.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.home_outlined, size: 16, color: AuroraColors.success),
              const SizedBox(width: 6),
              Expanded(
                child: Text(s['homeAddress'] as String? ?? '',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AuroraText.bodySmall
                        .copyWith(color: AuroraColors.pearl)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.location_on,
                  size: 16, color: AuroraColors.ember),
              const SizedBox(width: 6),
              Expanded(
                child: Text(s['workAddress'] as String? ?? '',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AuroraText.bodySmall
                        .copyWith(color: AuroraColors.pearl)),
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.sm),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              if (outbound != null)
                _chip(Icons.arrow_forward, '${tr('outbound')} $outbound'),
              if (returnT != null)
                _chip(Icons.arrow_back, '${tr('returnLeg')} $returnT'),
              _chip(Icons.calendar_today, _daysLabel(days)),
              _chip(
                  planType == 'monthly'
                      ? Icons.calendar_month
                      : Icons.today,
                  tr('plan_$planType')),
            ],
          ),
          const SizedBox(height: AuroraSpacing.sm),
          Row(
            children: [
              Switch(
                value: active,
                activeColor: AuroraColors.ember,
                onChanged: (v) => _toggleActive(s['id'] as int, v),
              ),
              Text(active ? tr('active') : tr('paused'),
                  style: AuroraText.bodySmall),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.delete_outline,
                    color: AuroraColors.danger),
                onPressed: () => _delete(s['id'] as int),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _chip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.sm),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AuroraColors.ember),
          const SizedBox(width: 4),
          Text(label,
              style: AuroraText.bodySmall.copyWith(color: AuroraColors.pearl)),
        ],
      ),
    );
  }

  String _daysLabel(List<int> days) {
    const names = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
    return days.map((d) => names[d % 7]).join('·');
  }
}
