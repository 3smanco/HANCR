import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// الدعم والشكاوى — تقديم شكوى وعرض حالتها وخطّها الزمني (read-only).
class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  List<Map<String, dynamic>> _complaints = [];
  bool _loading = true;
  String? _error;

  static const _categories = [
    'safety',
    'fare',
    'route',
    'cleanliness',
    'behavior',
    'other'
  ];

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
        document: gql(myComplaintsQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (res.hasException) throw res.exception!;
      if (!mounted) return;
      setState(() {
        _complaints =
            (res.data?['myComplaints'] as List?)?.cast<Map<String, dynamic>>() ??
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

  Color _statusColor(String s) {
    switch (s) {
      case 'resolved':
        return AuroraColors.success;
      case 'dismissed':
        return AuroraColors.textSecondary;
      case 'under_review':
        return AuroraColors.warning;
      default:
        return AuroraColors.ember;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('support'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AuroraColors.ember,
        onPressed: _newComplaint,
        icon: Icon(Icons.add, color: AuroraColors.pearl),
        label: Text(tr('newComplaint'),
            style: AuroraText.buttonMedium.copyWith(color: AuroraColors.pearl)),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: _loading
              ? Center(
                  child: CircularProgressIndicator(color: AuroraColors.ember))
              : _error != null
                  ? Center(child: Text(_error!, style: AuroraText.bodyMedium))
                  : _complaints.isEmpty
                      ? Center(
                          child: Text(tr('noComplaints'),
                              style: AuroraText.bodySmall))
                      : ListView(
                          padding: const EdgeInsets.all(AuroraSpacing.lg),
                          children: _complaints.map(_complaintCard).toList(),
                        ),
        ),
      ),
    );
  }

  Widget _complaintCard(Map<String, dynamic> c) {
    final status = c['status'] as String? ?? 'submitted';
    final activities =
        (c['activities'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          iconColor: AuroraColors.ember,
          collapsedIconColor: AuroraColors.textSecondary,
          title: Text(tr('cat_${c['category']}'),
              style:
                  AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl)),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: _statusColor(status).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(AuroraRadius.pill),
              ),
              child: Text(tr('cstatus_$status'),
                  style: AuroraText.caption
                      .copyWith(color: _statusColor(status))),
            ),
          ),
          childrenPadding: const EdgeInsets.fromLTRB(
              AuroraSpacing.lg, 0, AuroraSpacing.lg, AuroraSpacing.lg),
          children: [
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: Text(c['description'] as String? ?? '',
                  style: AuroraText.bodySmall.copyWith(height: 1.4)),
            ),
            if ((c['resolutionNote'] as String?)?.isNotEmpty == true) ...[
              const SizedBox(height: AuroraSpacing.sm),
              Text('${tr('resolution')}: ${c['resolutionNote']}',
                  style: AuroraText.bodySmall
                      .copyWith(color: AuroraColors.success)),
            ],
            if (activities.isNotEmpty) ...[
              const Divider(color: AuroraColors.border),
              ...activities.map((a) {
                final mine = a['type'] == 'rider_message';
                return Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(mine ? Icons.reply : Icons.circle,
                          size: mine ? 12 : 8,
                          color: mine
                              ? AuroraColors.pearl
                              : AuroraColors.ember),
                      const SizedBox(width: AuroraSpacing.sm),
                      Expanded(
                        child: Text(
                            a['note'] as String? ?? tr('act_${a['type']}'),
                            style: AuroraText.caption.copyWith(
                                color: mine
                                    ? AuroraColors.pearl
                                    : AuroraColors.textSecondary)),
                      ),
                    ],
                  ),
                );
              }),
            ],
            const SizedBox(height: AuroraSpacing.sm),
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: AuroraButton.pill(
                label: tr('replyTicket'),
                icon: Icons.reply,
                onPressed: () => _reply(c['id'] as int),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _reply(int complaintId) async {
    final ctl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('replyTicket'), style: AuroraText.titleSmall),
        content: TextField(
          controller: ctl,
          autofocus: true,
          maxLines: 4,
          style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
          decoration: InputDecoration(hintText: tr('complaintDescHint')),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(tr('cancel'),
                style: TextStyle(color: AuroraColors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(tr('submit'),
                style: TextStyle(color: AuroraColors.ember)),
          ),
        ],
      ),
    );
    if (ok != true || ctl.text.trim().isEmpty) return;
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(replyToComplaintMutation),
        variables: {'complaintId': complaintId, 'message': ctl.text.trim()},
      ));
      if (res.hasException) throw res.exception!;
      await _load();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(tr('loadError')),
          backgroundColor: AuroraColors.danger,
        ));
      }
    }
  }

  Future<void> _newComplaint() async {
    String category = 'other';
    final descCtl = TextEditingController();
    final submitted = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AuroraColors.coal,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AuroraRadius.lg)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding:
              EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tr('newComplaint'), style: AuroraText.titleMedium),
                const SizedBox(height: AuroraSpacing.lg),
                Text(tr('complaintCategory'), style: AuroraText.bodySmall),
                const SizedBox(height: AuroraSpacing.sm),
                Wrap(
                  spacing: AuroraSpacing.sm,
                  runSpacing: AuroraSpacing.sm,
                  children: _categories.map((cat) {
                    final sel = category == cat;
                    return GestureDetector(
                      onTap: () => setSheet(() => category = cat),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: sel ? AuroraColors.smoke : AuroraColors.ash,
                          borderRadius:
                              BorderRadius.circular(AuroraRadius.pill),
                          border: Border.all(
                              color: sel
                                  ? AuroraColors.ember
                                  : AuroraColors.border),
                        ),
                        child: Text(tr('cat_$cat'),
                            style: AuroraText.caption.copyWith(
                                color: sel
                                    ? AuroraColors.pearl
                                    : AuroraColors.textSecondary)),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: AuroraSpacing.lg),
                TextField(
                  controller: descCtl,
                  maxLines: 4,
                  style: AuroraText.bodyMedium
                      .copyWith(color: AuroraColors.pearl),
                  decoration: InputDecoration(
                    hintText: tr('complaintDescHint'),
                    filled: true,
                    fillColor: AuroraColors.ash,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AuroraRadius.md),
                      borderSide: const BorderSide(color: AuroraColors.border),
                    ),
                  ),
                ),
                const SizedBox(height: AuroraSpacing.lg),
                AuroraButton.primary(
                  label: tr('submit'),
                  onPressed: () async {
                    if (descCtl.text.trim().length < 5) return;
                    Navigator.pop(ctx, true);
                  },
                ),
                const SizedBox(height: AuroraSpacing.sm),
              ],
            ),
          ),
        ),
      ),
    );
    if (submitted != true) return;
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(submitComplaintMutation),
        variables: {
          'input': {
            'category': category,
            'description': descCtl.text.trim(),
          }
        },
      ));
      if (res.hasException) throw res.exception!;
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(tr('complaintSubmitted')),
          backgroundColor: AuroraColors.success,
        ));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(tr('loadError')),
          backgroundColor: AuroraColors.danger,
        ));
      }
    }
  }
}
