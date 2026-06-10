import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/payouts_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// I4 — شاشة طرق سحب أرباح السائق.
class AuroraPayoutMethodsScreen extends StatefulWidget {
  const AuroraPayoutMethodsScreen({super.key});

  @override
  State<AuroraPayoutMethodsScreen> createState() =>
      _AuroraPayoutMethodsScreenState();
}

class _AuroraPayoutMethodsScreenState
    extends State<AuroraPayoutMethodsScreen> {
  List<Map<String, dynamic>> _methods = [];
  bool _loading = true;
  bool _showAdd = false;

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
        document: gql(myPayoutMethodsQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (!mounted) return;
      setState(() {
        _methods = (res.data?['myPayoutMethods'] as List<dynamic>? ?? [])
            .cast<Map<String, dynamic>>();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _setDefault(int id) async {
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(MutationOptions(
        document: gql(setDefaultPayoutMethodMutation),
        variables: {'id': id},
      ));
      _toast(tr('payout_set_default_ok'));
      await _load();
    } catch (e) {
      _toast(e.toString());
    }
  }

  Future<void> _remove(int id) async {
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(MutationOptions(
        document: gql(removePayoutMethodMutation),
        variables: {'id': id},
      ));
      _toast(tr('payout_removed'));
      await _load();
    } catch (e) {
      _toast(e.toString());
    }
  }

  void _toast(String s) => ScaffoldMessenger.of(context)
      .showSnackBar(SnackBar(content: Text(s)));

  String _summary(Map<String, dynamic> m) {
    final type = m['type'] as String? ?? 'bank';
    if (type == 'stcpay') {
      return 'STC Pay · ${m['phoneNumber'] ?? '—'}';
    }
    final iban = (m['iban'] as String? ?? '');
    final tail = iban.isNotEmpty
        ? iban.substring(iban.length > 4 ? iban.length - 4 : 0)
        : '????';
    final bank = m['bankName'] as String? ?? (type == 'mada' ? 'مدى' : 'بنك');
    return '$bank · ****$tail';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('payout_methods'), style: AuroraText.titleSmall),
      ),
      body: _loading
          ? Center(
              child: CircularProgressIndicator(color: AuroraColors.ember))
          : RefreshIndicator(
              onRefresh: _load,
              color: AuroraColors.ember,
              child: ListView(
                padding: const EdgeInsets.all(AuroraSpacing.lg),
                children: [
                  Text(
                    tr('payout_methods_hint'),
                    style: AuroraText.bodySmall
                        .copyWith(color: AuroraColors.textSecondary),
                  ),
                  const SizedBox(height: AuroraSpacing.lg),
                  ..._methods.map(_methodCard),
                  const SizedBox(height: AuroraSpacing.md),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => setState(() => _showAdd = true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AuroraColors.ember,
                        foregroundColor: Colors.white,
                      ),
                      icon: const Icon(Icons.add, size: 18),
                      label: Text(tr('add_payout_method')),
                    ),
                  ),
                ],
              ),
            ),
      bottomSheet: _showAdd
          ? _AddSheet(
              onClose: () => setState(() => _showAdd = false),
              onSaved: () async {
                setState(() => _showAdd = false);
                await _load();
              },
            )
          : null,
    );
  }

  Widget _methodCard(Map<String, dynamic> m) {
    final isDefault = m['isDefault'] as bool? ?? false;
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(
            color: isDefault ? AuroraColors.ember : AuroraColors.border,
            width: isDefault ? 2 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                m['type'] == 'stcpay'
                    ? Icons.phone_iphone
                    : Icons.account_balance,
                color: AuroraColors.ember,
                size: 22,
              ),
              const SizedBox(width: AuroraSpacing.sm),
              Expanded(
                child: Text(_summary(m), style: AuroraText.titleSmall),
              ),
              if (isDefault)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AuroraColors.ember,
                    borderRadius: BorderRadius.circular(AuroraRadius.sm),
                  ),
                  child: Text(
                    tr('payout_default'),
                    style: AuroraText.caption.copyWith(color: Colors.white),
                  ),
                ),
            ],
          ),
          if (m['accountName'] != null) ...[
            const SizedBox(height: 4),
            Text(m['accountName'] as String,
                style: AuroraText.bodySmall
                    .copyWith(color: AuroraColors.textSecondary)),
          ],
          const SizedBox(height: AuroraSpacing.sm),
          Row(
            children: [
              if (!isDefault)
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _setDefault(m['id'] as int),
                    child: Text(tr('payout_make_default')),
                  ),
                ),
              if (!isDefault) const SizedBox(width: AuroraSpacing.sm),
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AuroraColors.danger,
                    side: BorderSide(color: AuroraColors.danger),
                  ),
                  onPressed: () => _confirmRemove(m['id'] as int),
                  child: Text(tr('remove')),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _confirmRemove(int id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('remove_payout_method_q'),
            style: AuroraText.titleSmall),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(tr('cancel'))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: AuroraColors.danger),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(tr('remove')),
          ),
        ],
      ),
    );
    if (ok == true) _remove(id);
  }
}

class _AddSheet extends StatefulWidget {
  final VoidCallback onClose;
  final Future<void> Function() onSaved;
  const _AddSheet({required this.onClose, required this.onSaved});

  @override
  State<_AddSheet> createState() => _AddSheetState();
}

class _AddSheetState extends State<_AddSheet> {
  String _type = 'bank';
  final _nameCtrl = TextEditingController();
  final _ibanCtrl = TextEditingController();
  final _bankCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _ibanCtrl.dispose();
    _bankCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final client = await GraphQLClientManager.get();
      final input = <String, dynamic>{
        'type': _type,
        if (_nameCtrl.text.trim().isNotEmpty)
          'accountName': _nameCtrl.text.trim(),
        if (_type != 'stcpay' && _ibanCtrl.text.trim().isNotEmpty)
          'iban': _ibanCtrl.text.trim().toUpperCase(),
        if (_type != 'stcpay' && _bankCtrl.text.trim().isNotEmpty)
          'bankName': _bankCtrl.text.trim(),
        if (_type == 'stcpay' && _phoneCtrl.text.trim().isNotEmpty)
          'phoneNumber': _phoneCtrl.text.trim(),
      };
      final res = await client.mutate(MutationOptions(
        document: gql(addPayoutMethodMutation),
        variables: {'input': input},
      ));
      if (res.hasException) throw res.exception!;
      await widget.onSaved();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString().replaceFirst('Exception: ', '')),
      ));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AuroraColors.coal,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: Border.all(color: AuroraColors.border),
      ),
      padding: EdgeInsets.fromLTRB(
          AuroraSpacing.lg,
          AuroraSpacing.md,
          AuroraSpacing.lg,
          MediaQuery.of(context).viewInsets.bottom + AuroraSpacing.lg),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(tr('add_payout_method'),
                    style: AuroraText.titleSmall),
              ),
              IconButton(
                onPressed: widget.onClose,
                icon: Icon(Icons.close, color: AuroraColors.pearl),
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.sm),
          Row(
            children: [
              for (final t in ['bank', 'mada', 'stcpay']) ...[
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _type = t),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _type == t
                            ? AuroraColors.ember.withValues(alpha: 0.12)
                            : AuroraColors.ash,
                        borderRadius: BorderRadius.circular(AuroraRadius.md),
                        border: Border.all(
                          color: _type == t
                              ? AuroraColors.ember
                              : AuroraColors.border,
                        ),
                      ),
                      child: Text(
                        tr('payout_type_$t'),
                        textAlign: TextAlign.center,
                        style: AuroraText.bodyMedium.copyWith(
                          color: _type == t
                              ? AuroraColors.ember
                              : AuroraColors.pearl,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ),
                if (t != 'stcpay') const SizedBox(width: 6),
              ],
            ],
          ),
          const SizedBox(height: AuroraSpacing.md),
          _field(
              ctrl: _nameCtrl,
              label: tr('account_name'),
              icon: Icons.person_outline),
          if (_type != 'stcpay') ...[
            const SizedBox(height: AuroraSpacing.sm),
            _field(
                ctrl: _ibanCtrl,
                label: 'IBAN',
                icon: Icons.numbers,
                textCapitalization: TextCapitalization.characters),
            const SizedBox(height: AuroraSpacing.sm),
            _field(
                ctrl: _bankCtrl,
                label: tr('bank_name'),
                icon: Icons.account_balance),
          ] else ...[
            const SizedBox(height: AuroraSpacing.sm),
            _field(
                ctrl: _phoneCtrl,
                label: tr('phone_number'),
                icon: Icons.phone,
                keyboardType: TextInputType.phone),
          ],
          const SizedBox(height: AuroraSpacing.lg),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _saving ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: AuroraColors.ember,
                foregroundColor: Colors.white,
              ),
              child: Text(_saving ? tr('saving') : tr('save')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _field({
    required TextEditingController ctrl,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    TextCapitalization textCapitalization = TextCapitalization.none,
  }) {
    return TextField(
      controller: ctrl,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
      decoration: InputDecoration(
        hintText: label,
        filled: true,
        fillColor: AuroraColors.ash,
        prefixIcon: Icon(icon, color: AuroraColors.ember, size: 18),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }
}
