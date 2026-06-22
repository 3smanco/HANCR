import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/motion/motion.dart';
import 'aurora_family_screen.dart';

/// إدارة العائلة الفعلية — مرتبطة بالخادم (hancr_pool):
/// إنشاء مجموعة، دعوة أعضاء بالهاتف، حدود إنفاق شهرية، إزالة/مغادرة.
class AuroraFamilyManageScreen extends StatefulWidget {
  const AuroraFamilyManageScreen({super.key});

  @override
  State<AuroraFamilyManageScreen> createState() =>
      _AuroraFamilyManageScreenState();
}

class _AuroraFamilyManageScreenState extends State<AuroraFamilyManageScreen> {
  Map<String, dynamic>? _pool;
  bool _loading = true;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(myPoolQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (res.hasException) throw res.exception!;
      if (!mounted) return;
      setState(() {
        _pool = res.data?['myPool'] as Map<String, dynamic>?;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = tr('loadError');
        _loading = false;
      });
    }
  }

  Future<Map<String, dynamic>?> _run(
    String doc,
    Map<String, dynamic> vars,
    String field,
  ) async {
    setState(() => _busy = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(doc),
        variables: vars,
      ));
      if (res.hasException) throw res.exception!;
      return res.data?[field] as Map<String, dynamic>?;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(_humanError(e)),
          backgroundColor: AuroraColors.danger,
        ));
      }
      return null;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String _humanError(Object e) {
    final s = e.toString();
    final m = RegExp(r'message:\s*([^,)]+)').firstMatch(s);
    return m?.group(1)?.trim() ?? tr('loadError');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('family'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: _loading
              ? const Center(child: AuroraLoader(size: 36))
              : _error != null
                  ? _errorView()
                  : _pool == null
                      ? _emptyView()
                      : _poolView(),
        ),
      ),
    );
  }

  Widget _errorView() => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_error!, style: AuroraText.bodyMedium),
            const SizedBox(height: AuroraSpacing.md),
            AuroraButton.secondary(
                label: tr('retry'), fullWidth: false, onPressed: _load),
          ],
        ),
      );

  // ─── لا مجموعة بعد ───
  Widget _emptyView() {
    return ListView(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(AuroraRadius.lg),
          child: Image.asset('assets/images/family-start.png',
              height: 170, width: double.infinity, fit: BoxFit.cover),
        ),
        const SizedBox(height: AuroraSpacing.lg),
        Text(tr('famTitle'), style: AuroraText.displayMedium),
        const SizedBox(height: AuroraSpacing.sm),
        Text(tr('famSub'), style: AuroraText.bodyMedium),
        const SizedBox(height: AuroraSpacing.xl),
        AuroraButton.primary(
          label: tr('createFamily'),
          icon: Icons.group_add_outlined,
          onPressed: _busy ? null : _createFamily,
        ),
        const SizedBox(height: AuroraSpacing.md),
        AuroraButton.secondary(
          label: tr('inviteViaShare'),
          icon: Icons.ios_share,
          onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AuroraFamilyScreen())),
        ),
      ],
    );
  }

  Future<void> _createFamily() async {
    final name = await _promptText(tr('familyNameHint'), tr('createFamily'));
    if (name == null) return;
    final pool =
        await _run(createFamilyMutation, {'name': name}, 'createFamily');
    if (pool != null && mounted) setState(() => _pool = pool);
  }

  // ─── مجموعة موجودة ───
  Widget _poolView() {
    final pool = _pool!;
    final isOwner = pool['isOwner'] == true;
    final members =
        (pool['members'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    return ListView(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      children: [
        Row(
          children: [
            Icon(Icons.family_restroom, color: AuroraColors.ember, size: 28),
            const SizedBox(width: AuroraSpacing.md),
            Expanded(
              child: Text(pool['name'] as String? ?? tr('family'),
                  style: AuroraText.titleLarge),
            ),
          ],
        ),
        const SizedBox(height: AuroraSpacing.lg),
        Text(tr('familyMembers'), style: AuroraText.titleSmall),
        const SizedBox(height: AuroraSpacing.sm),
        ...members.map((m) => _memberTile(m, isOwner)),
        const SizedBox(height: AuroraSpacing.lg),
        if (isOwner)
          AuroraButton.primary(
            label: tr('inviteFamily'),
            icon: Icons.person_add_alt,
            onPressed: _busy ? null : _invite,
          ),
        const SizedBox(height: AuroraSpacing.md),
        if (isOwner)
          AuroraButton.secondary(
            label: tr('deleteFamily'),
            icon: Icons.delete_outline,
            onPressed: _busy ? null : _deleteFamily,
          )
        else
          AuroraButton.secondary(
            label: tr('leaveFamily'),
            icon: Icons.logout,
            onPressed: _busy ? null : _leaveFamily,
          ),
      ],
    );
  }

  Widget _memberTile(Map<String, dynamic> m, bool isOwner) {
    final role = m['role'] as String?;
    final isOwnerMember = role == 'owner';
    final limit = (m['monthlySpendLimit'] as num?)?.toDouble();
    final spent = (m['currentMonthSpend'] as num?)?.toDouble() ?? 0;
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(m['riderName'] as String? ?? '—',
                        style: AuroraText.bodyMedium
                            .copyWith(color: AuroraColors.pearl)),
                    Text(isOwnerMember ? tr('roleOwner') : (m['phone'] ?? ''),
                        style: AuroraText.caption),
                  ],
                ),
              ),
              if (isOwner && !isOwnerMember) ...[
                IconButton(
                  icon: Icon(Icons.tune, color: AuroraColors.ember, size: 20),
                  onPressed:
                      _busy ? null : () => _editLimit(m['id'] as int, limit),
                ),
                IconButton(
                  icon: Icon(Icons.person_remove_outlined,
                      color: AuroraColors.danger, size: 20),
                  onPressed: _busy ? null : () => _removeMember(m['id'] as int),
                ),
              ],
            ],
          ),
          if (!isOwnerMember && limit != null) ...[
            const SizedBox(height: AuroraSpacing.sm),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: limit > 0 ? (spent / limit).clamp(0, 1) : 0,
                backgroundColor: AuroraColors.smoke,
                color:
                    spent >= limit ? AuroraColors.danger : AuroraColors.success,
                minHeight: 6,
              ),
            ),
            const SizedBox(height: 4),
            Text(
                '${tr('spendLimit')}: ${spent.toStringAsFixed(0)} / ${limit.toStringAsFixed(0)}',
                style: AuroraText.caption),
          ],
        ],
      ),
    );
  }

  Future<void> _invite() async {
    final phone = await _promptText(tr('memberPhoneHint'), tr('inviteFamily'),
        keyboard: TextInputType.phone);
    if (phone == null) return;
    final limit = await _promptText(tr('spendLimitHint'), tr('spendLimit'),
        keyboard: TextInputType.number, optional: true);
    final pool = await _run(
        inviteFamilyMemberMutation,
        {
          'phone': phone,
          if (limit != null && limit.isNotEmpty)
            'monthlySpendLimit': double.tryParse(limit),
        },
        'inviteFamilyMember');
    if (pool != null && mounted) setState(() => _pool = pool);
  }

  Future<void> _editLimit(int memberId, double? current) async {
    final limit = await _promptText(tr('spendLimitHint'), tr('spendLimit'),
        keyboard: TextInputType.number,
        optional: true,
        initial: current?.toStringAsFixed(0));
    final pool = await _run(
        updateFamilyMemberLimitMutation,
        {
          'memberId': memberId,
          'monthlySpendLimit': (limit != null && limit.isNotEmpty)
              ? double.tryParse(limit)
              : null,
        },
        'updateFamilyMemberLimit');
    if (pool != null && mounted) setState(() => _pool = pool);
  }

  Future<void> _removeMember(int memberId) async {
    if (!await _confirm(tr('removeMemberConfirm'))) return;
    final pool = await _run(removeFamilyMemberMutation, {'memberId': memberId},
        'removeFamilyMember');
    if (pool != null && mounted) setState(() => _pool = pool);
  }

  Future<void> _deleteFamily() async {
    if (!await _confirm(tr('deleteFamilyConfirm'))) return;
    final client = await GraphQLClientManager.get();
    setState(() => _busy = true);
    await client.mutate(MutationOptions(document: gql(deleteFamilyMutation)));
    if (mounted) setState(() => _busy = false);
    await _load();
  }

  Future<void> _leaveFamily() async {
    if (!await _confirm(tr('leaveFamilyConfirm'))) return;
    final client = await GraphQLClientManager.get();
    setState(() => _busy = true);
    await client.mutate(MutationOptions(document: gql(leaveFamilyMutation)));
    if (mounted) setState(() => _busy = false);
    await _load();
  }

  // ─── حوارات مساعدة ───
  Future<String?> _promptText(String hint, String title,
      {TextInputType? keyboard, bool optional = false, String? initial}) async {
    final ctl = TextEditingController(text: initial);
    return showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        title: Text(title, style: AuroraText.titleSmall),
        content: TextField(
          controller: ctl,
          keyboardType: keyboard,
          autofocus: true,
          style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: AuroraText.bodySmall,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(tr('cancel'),
                style: TextStyle(color: AuroraColors.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              final v = ctl.text.trim();
              if (v.isEmpty && !optional) return;
              Navigator.pop(ctx, v);
            },
            child: Text(tr('confirm'),
                style: TextStyle(color: AuroraColors.ember)),
          ),
        ],
      ),
    );
  }

  Future<bool> _confirm(String body) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        content: Text(body, style: AuroraText.bodyMedium),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(tr('cancel'),
                style: TextStyle(color: AuroraColors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(tr('confirm'),
                style: TextStyle(color: AuroraColors.danger)),
          ),
        ],
      ),
    );
    return ok ?? false;
  }
}
