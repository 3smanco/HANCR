import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/motion/motion.dart';

/// المجموعات المحفوظة — شخصية/مهنية، مع إنشاء/تعديل/حذف وأعضاء بالهاتف.
class SavedGroupsScreen extends StatefulWidget {
  const SavedGroupsScreen({super.key});

  @override
  State<SavedGroupsScreen> createState() => _SavedGroupsScreenState();
}

class _SavedGroupsScreenState extends State<SavedGroupsScreen> {
  List<Map<String, dynamic>> _groups = [];
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
        document: gql(mySavedGroupsQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (res.hasException) throw res.exception!;
      if (!mounted) return;
      setState(() {
        _groups = (res.data?['mySavedGroups'] as List?)
                ?.cast<Map<String, dynamic>>() ??
            [];
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = tr('loadError');
        _loading = false;
      });
    }
  }

  Future<void> _run(String doc, Map<String, dynamic> vars) async {
    setState(() => _busy = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client
          .mutate(MutationOptions(document: gql(doc), variables: vars));
      if (res.hasException) throw res.exception!;
      await _load();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(tr('loadError')),
          backgroundColor: AuroraColors.danger,
        ));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final personal = _groups.where((g) => g['type'] != 'business').toList();
    final business = _groups.where((g) => g['type'] == 'business').toList();
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('savedGroups'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AuroraColors.ember,
        onPressed: _busy ? null : () => _edit(null),
        child: Icon(Icons.add, color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: _loading
              ? const Center(child: AuroraLoader(size: 36))
              : _error != null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(_error!, style: AuroraText.bodyMedium),
                          const SizedBox(height: AuroraSpacing.md),
                          AuroraButton.secondary(
                              label: tr('retry'),
                              fullWidth: false,
                              onPressed: _load),
                        ],
                      ),
                    )
                  : ListView(
                      padding: const EdgeInsets.all(AuroraSpacing.lg),
                      children: [
                        _section(tr('personalGroups'), personal),
                        const SizedBox(height: AuroraSpacing.lg),
                        _section(tr('businessGroups'), business),
                        if (_groups.isEmpty)
                          Padding(
                            padding:
                                const EdgeInsets.only(top: AuroraSpacing.xl),
                            child: Center(
                                child: Text(tr('noGroups'),
                                    style: AuroraText.bodySmall)),
                          ),
                      ],
                    ),
        ),
      ),
    );
  }

  Widget _section(String title, List<Map<String, dynamic>> groups) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: AuroraText.titleSmall),
        const SizedBox(height: AuroraSpacing.sm),
        if (groups.isEmpty)
          Text(tr('noGroups'), style: AuroraText.caption)
        else
          ...groups.map((g) {
            final members =
                (g['members'] as List?)?.cast<Map<String, dynamic>>() ?? [];
            return AuroraListRow(
              icon: Icons.groups_outlined,
              title: g['name'] as String? ?? '—',
              subtitle: '${members.length} ${tr('membersCount')}',
              onTap: () => _edit(g),
              trailing: IconButton(
                icon: Icon(Icons.delete_outline,
                    color: AuroraColors.danger, size: 20),
                onPressed: _busy ? null : () => _delete(g['id'] as int),
              ),
            );
          }),
      ],
    );
  }

  Future<void> _delete(int id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        content: Text(tr('deleteGroupConfirm'), style: AuroraText.bodyMedium),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(tr('cancel'),
                  style: TextStyle(color: AuroraColors.textSecondary))),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(tr('confirm'),
                  style: TextStyle(color: AuroraColors.danger))),
        ],
      ),
    );
    if (ok == true) {
      await _run(deleteSavedGroupMutation, {'id': id});
    }
  }

  Future<void> _edit(Map<String, dynamic>? group) async {
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AuroraColors.coal,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AuroraRadius.lg)),
      ),
      builder: (_) => _GroupEditor(group: group),
    );
    if (result == null) return;
    if (group == null) {
      await _run(createSavedGroupMutation, result);
    } else {
      await _run(updateSavedGroupMutation, {'id': group['id'], ...result});
    }
  }
}

class _GroupEditor extends StatefulWidget {
  final Map<String, dynamic>? group;
  const _GroupEditor({this.group});
  @override
  State<_GroupEditor> createState() => _GroupEditorState();
}

class _GroupEditorState extends State<_GroupEditor> {
  late final TextEditingController _name =
      TextEditingController(text: widget.group?['name'] as String? ?? '');
  late String _type = (widget.group?['type'] as String?) == 'business'
      ? 'business'
      : 'personal';
  late final List<Map<String, dynamic>> _members = [
    ...((widget.group?['members'] as List?)?.cast<Map<String, dynamic>>() ?? [])
        .map((m) => {'name': m['name'], 'phone': m['phone']}),
  ];

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _addMember() async {
    final nameCtl = TextEditingController();
    final phoneCtl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('addMember'), style: AuroraText.titleSmall),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtl,
              style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
              decoration: InputDecoration(hintText: tr('fullName')),
            ),
            TextField(
              controller: phoneCtl,
              keyboardType: TextInputType.phone,
              style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
              decoration: InputDecoration(hintText: tr('phoneNumber')),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(tr('cancel'),
                  style: TextStyle(color: AuroraColors.textSecondary))),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(tr('confirm'),
                  style: TextStyle(color: AuroraColors.ember))),
        ],
      ),
    );
    if (ok == true && phoneCtl.text.trim().isNotEmpty) {
      setState(() => _members
          .add({'name': nameCtl.text.trim(), 'phone': phoneCtl.text.trim()}));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.group == null ? tr('newGroup') : tr('editGroup'),
                style: AuroraText.titleMedium),
            const SizedBox(height: AuroraSpacing.lg),
            TextField(
              controller: _name,
              style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
              decoration: InputDecoration(hintText: tr('groupNameHint')),
            ),
            const SizedBox(height: AuroraSpacing.md),
            Row(
              children: [
                _typeChip('personal', tr('personalGroups')),
                const SizedBox(width: AuroraSpacing.sm),
                _typeChip('business', tr('businessGroups')),
              ],
            ),
            const SizedBox(height: AuroraSpacing.lg),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${tr('membersCount')} (${_members.length})',
                    style: AuroraText.titleSmall),
                AuroraButton.pill(
                    label: tr('addMember'),
                    icon: Icons.person_add_alt,
                    onPressed: _addMember),
              ],
            ),
            const SizedBox(height: AuroraSpacing.sm),
            ..._members.asMap().entries.map((e) => ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.person_outline,
                      color: AuroraColors.ember, size: 20),
                  title: Text(
                      (e.value['name'] as String?)?.isNotEmpty == true
                          ? e.value['name'] as String
                          : e.value['phone'] as String,
                      style: AuroraText.bodySmall
                          .copyWith(color: AuroraColors.pearl)),
                  subtitle: Text(e.value['phone'] as String? ?? '',
                      style: AuroraText.caption),
                  trailing: IconButton(
                    icon: Icon(Icons.close,
                        color: AuroraColors.textSecondary, size: 18),
                    onPressed: () => setState(() => _members.removeAt(e.key)),
                  ),
                )),
            const SizedBox(height: AuroraSpacing.lg),
            AuroraButton.primary(
              label: tr('save'),
              icon: Icons.check,
              onPressed: () {
                if (_name.text.trim().isEmpty) return;
                Navigator.pop(context, {
                  'name': _name.text.trim(),
                  'type': _type,
                  'members': _members,
                });
              },
            ),
            const SizedBox(height: AuroraSpacing.sm),
          ],
        ),
      ),
    );
  }

  Widget _typeChip(String value, String label) {
    final sel = _type == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _type = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AuroraSpacing.md),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: sel ? AuroraColors.smoke : AuroraColors.ash,
            borderRadius: BorderRadius.circular(AuroraRadius.md),
            border: Border.all(
                color: sel ? AuroraColors.ember : AuroraColors.border,
                width: sel ? 1.5 : 1),
          ),
          child: Text(label,
              style: AuroraText.bodySmall.copyWith(
                  color:
                      sel ? AuroraColors.pearl : AuroraColors.textSecondary)),
        ),
      ),
    );
  }
}
