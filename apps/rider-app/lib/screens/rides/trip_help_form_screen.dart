import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../profile/support_screen.dart';

/// نموذج شكوى/مساعدة خاصّ برحلة — يربط الشكوى بـ orderId والفئة المناسبة.
class TripHelpFormScreen extends StatefulWidget {
  final int orderId;
  final String category;
  final String title;
  const TripHelpFormScreen({
    required this.orderId,
    required this.category,
    required this.title,
    super.key,
  });

  @override
  State<TripHelpFormScreen> createState() => _TripHelpFormScreenState();
}

class _TripHelpFormScreenState extends State<TripHelpFormScreen> {
  final _ctl = TextEditingController();
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _ctl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _ctl.dispose();
    super.dispose();
  }

  bool get _valid => _ctl.text.trim().length >= 5;

  String get _policy {
    switch (widget.category) {
      case 'fare':
        return tr('policyFare');
      case 'safety':
        return tr('policySafety');
      default:
        return tr('policyGeneral');
    }
  }

  Future<void> _submit() async {
    if (!_valid) return;
    setState(() => _busy = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(submitComplaintMutation),
        variables: {
          'input': {
            'orderId': widget.orderId,
            'category': widget.category,
            'description': _ctl.text.trim(),
          }
        },
      ));
      if (res.hasException) throw res.exception!;
      if (!mounted) return;
      // استبدال هذه الشاشة بسجلّ التذاكر (واجهة الحالة/المحادثة)
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const SupportScreen()),
      );
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(tr('complaintSubmitted')),
        backgroundColor: AuroraColors.success,
      ));
    } catch (_) {
      if (mounted) {
        setState(() => _busy = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(tr('loadError')),
          backgroundColor: AuroraColors.danger,
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(widget.title, style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(AuroraSpacing.lg),
                  children: [
                    Text(widget.title, style: AuroraText.titleLarge),
                    const SizedBox(height: AuroraSpacing.md),
                    Text(_policy,
                        style: AuroraText.bodyMedium.copyWith(height: 1.6)),
                    const SizedBox(height: AuroraSpacing.lg),
                    Text(tr('describeIssue'), style: AuroraText.bodySmall),
                    const SizedBox(height: AuroraSpacing.sm),
                    TextField(
                      controller: _ctl,
                      maxLines: 6,
                      style: AuroraText.bodyMedium
                          .copyWith(color: AuroraColors.pearl),
                      decoration: InputDecoration(
                        hintText: tr('complaintDescHint'),
                        filled: true,
                        fillColor: AuroraColors.ash,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AuroraRadius.md),
                          borderSide:
                              BorderSide(color: AuroraColors.border),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AuroraRadius.md),
                          borderSide:
                              BorderSide(color: AuroraColors.ember, width: 1.5),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              AuroraStickyButton(
                label: tr('submit'),
                onPressed: (_valid && !_busy) ? _submit : null,
                loading: _busy,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
