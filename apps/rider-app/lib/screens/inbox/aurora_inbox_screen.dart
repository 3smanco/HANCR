import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/inbox_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

class _Announcement {
  final int id;
  final String title;
  final String body;
  final String? url;
  const _Announcement(this.id, this.title, this.body, this.url);
}

/// AuroraInboxScreen — مركز الرسائل (مستوحى من Inbox في Uber، بهوية HANCR).
/// كبسولات تصفية + حقل كود عرض + قائمة إعلانات (activeAnnouncements).
class AuroraInboxScreen extends StatefulWidget {
  const AuroraInboxScreen({super.key});
  @override
  State<AuroraInboxScreen> createState() => _AuroraInboxScreenState();
}

class _AuroraInboxScreenState extends State<AuroraInboxScreen> {
  final _code = TextEditingController();
  int _filter = 0; // 0=All 1=Offers 2=Support 3=Updates
  bool _loading = true;
  bool _claiming = false;
  List<_Announcement> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(activeAnnouncementsQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final list = (res.data?['activeAnnouncements'] as List?) ?? [];
      if (!mounted) return;
      setState(() {
        _items = list
            .map((e) => _Announcement(
                  e['id'] as int,
                  (e['title'] as String?) ?? '',
                  (e['body'] as String?) ?? '',
                  e['url'] as String?,
                ))
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _claim() async {
    final code = _code.text.trim();
    if (code.isEmpty || _claiming) return;
    setState(() => _claiming = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(claimGiftCodeMutation),
        variables: {'code': code},
      ));
      if (res.hasException) throw res.exception!;
      final d = res.data?['claimGiftCode'] as Map<String, dynamic>?;
      final amount = (d?['amount'] as num?)?.toStringAsFixed(2) ?? '';
      final currency = (d?['currency'] as String?) ?? '';
      if (!mounted) return;
      _code.clear();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('${tr('codeApplied')} +$amount $currency'),
        backgroundColor: AuroraColors.success,
      ));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: AuroraColors.danger,
        ));
      }
    } finally {
      if (mounted) setState(() => _claiming = false);
    }
  }

  // الإعلانات بلا حقل تصنيف بعد ⇒ تظهر تحت "الكل" و"تحديثات".
  List<_Announcement> get _visible =>
      (_filter == 0 || _filter == 3) ? _items : const [];

  @override
  Widget build(BuildContext context) {
    final filters = [
      tr('filterAll'),
      tr('filterOffers'),
      tr('filterSupport'),
      tr('filterUpdates'),
    ];
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: AuroraColors.pearl),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text(tr('inbox'), style: AuroraText.titleMedium),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              // ─── filter chips ───
              SizedBox(
                height: 44,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding:
                      const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
                  itemCount: filters.length,
                  separatorBuilder: (_, __) =>
                      const SizedBox(width: AuroraSpacing.sm),
                  itemBuilder: (_, i) => _chip(filters[i], i),
                ),
              ),
              const SizedBox(height: AuroraSpacing.sm),
              // ─── offer code field ───
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
                child: _offerCodeField(),
              ),
              const SizedBox(height: AuroraSpacing.md),
              // ─── list ───
              Expanded(
                child: _loading
                    ? Center(
                        child: CircularProgressIndicator(
                            color: AuroraColors.ember))
                    : _visible.isEmpty
                        ? _empty()
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(AuroraSpacing.lg,
                                0, AuroraSpacing.lg, AuroraSpacing.xl),
                            itemCount: _visible.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: AuroraSpacing.sm),
                            itemBuilder: (_, i) => _messageCard(_visible[i]),
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _chip(String label, int i) {
    final selected = _filter == i;
    return GestureDetector(
      onTap: () => setState(() => _filter = i),
      child: Container(
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
        decoration: BoxDecoration(
          color: selected ? AuroraColors.ember : AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.pill),
          border: Border.all(
              color: selected ? AuroraColors.ember : AuroraColors.border),
        ),
        child: Text(
          label,
          style: AuroraText.bodySmall.copyWith(
            color: selected ? AuroraColors.pearl : AuroraColors.textSecondary,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _offerCodeField() {
    return Container(
      padding: const EdgeInsets.only(left: AuroraSpacing.md, right: 6),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Row(
        children: [
          Icon(Icons.local_offer_outlined,
              color: AuroraColors.textSecondary, size: 18),
          const SizedBox(width: AuroraSpacing.sm),
          Expanded(
            child: TextField(
              controller: _code,
              style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                hintText: tr('addOfferCode'),
                hintStyle: AuroraText.bodySmall,
                border: InputBorder.none,
              ),
              onSubmitted: (_) => _claim(),
            ),
          ),
          TextButton(
            onPressed: _claiming ? null : _claim,
            child: _claiming
                ? SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: AuroraColors.ember))
                : Text(tr('apply'),
                    style: AuroraText.titleSmall
                        .copyWith(color: AuroraColors.ember)),
          ),
        ],
      ),
    );
  }

  Widget _messageCard(_Announcement a) {
    return AuroraCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AuroraColors.smoke,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.campaign_outlined,
                color: AuroraColors.ember, size: 20),
          ),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(a.title, style: AuroraText.titleSmall),
                const SizedBox(height: 4),
                Text(a.body, style: AuroraText.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _empty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.mark_email_read_outlined,
              color: AuroraColors.textHint, size: 48),
          const SizedBox(height: AuroraSpacing.md),
          Text(tr('inboxEmpty'),
              style: AuroraText.bodyMedium
                  .copyWith(color: AuroraColors.textSecondary)),
        ],
      ),
    );
  }
}
