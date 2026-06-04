import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/documents_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// I1 — شاشة وثائق السائق
///
/// 5 أنواع: هوية، رخصة، استمارة، تأمين، شهادة عدلية.
/// لكل نوع: إن لم تُرفع تظهر "ارفع"؛ إن رُفعت تظهر شارة الحالة + زر "استبدل".
class AuroraDriverDocumentsScreen extends StatefulWidget {
  const AuroraDriverDocumentsScreen({super.key});

  @override
  State<AuroraDriverDocumentsScreen> createState() =>
      _AuroraDriverDocumentsScreenState();
}

class _AuroraDriverDocumentsScreenState
    extends State<AuroraDriverDocumentsScreen> {
  static const _types = <_DocTypeInfo>[
    _DocTypeInfo('national_id', 'doc_national_id', Icons.badge),
    _DocTypeInfo('license', 'doc_license', Icons.directions_car),
    _DocTypeInfo('vehicle_registration', 'doc_vehicle_registration', Icons.assignment),
    _DocTypeInfo('insurance', 'doc_insurance', Icons.health_and_safety),
    _DocTypeInfo('criminal_record', 'doc_criminal_record', Icons.verified_user),
  ];

  List<Map<String, dynamic>> _docs = [];
  bool _loading = true;
  String? _uploadingType;

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
        document: gql(myDocumentsQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (!mounted) return;
      setState(() {
        _docs = (res.data?['myDocuments'] as List<dynamic>? ?? [])
            .cast<Map<String, dynamic>>();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _uploadDoc(_DocTypeInfo info) async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 2000,
      imageQuality: 85,
    );
    if (file == null) return;

    // For now, we'd upload to GCS via a signed URL. As placeholder,
    // we pass the local path — backend stores it and admin reviews.
    // TODO(I1-next): wire signed-URL upload service.
    final url = file.path;
    setState(() => _uploadingType = info.type);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(uploadDocumentMutation),
        variables: {
          'input': {
            'type': info.type,
            'url': url,
          },
        },
      ));
      if (res.hasException) throw res.exception!;
      _toast(tr('doc_uploaded'));
      await _load();
    } catch (e) {
      _toast(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _uploadingType = null);
    }
  }

  void _toast(String s) => ScaffoldMessenger.of(context)
      .showSnackBar(SnackBar(content: Text(s)));

  Map<String, dynamic>? _findDoc(String type) {
    for (final d in _docs) {
      if (d['type'] == type) return d;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('myDocuments'), style: AuroraText.titleSmall),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AuroraColors.ember))
          : RefreshIndicator(
              onRefresh: _load,
              color: AuroraColors.ember,
              child: ListView(
                padding: const EdgeInsets.all(AuroraSpacing.lg),
                children: [
                  Text(
                    tr('documentsHint'),
                    style: AuroraText.bodySmall
                        .copyWith(color: AuroraColors.textSecondary),
                  ),
                  const SizedBox(height: AuroraSpacing.lg),
                  ..._types.map(_docCard),
                ],
              ),
            ),
    );
  }

  Widget _docCard(_DocTypeInfo info) {
    final doc = _findDoc(info.type);
    final status = doc?['status'] as String?;
    final rejectedReason = doc?['rejectedReason'] as String?;
    final busy = _uploadingType == info.type;

    final (statusColor, statusLabel, statusIcon) = switch (status) {
      'approved' => (
        AuroraColors.success,
        tr('doc_status_approved'),
        Icons.check_circle,
      ),
      'rejected' => (
        AuroraColors.danger,
        tr('doc_status_rejected'),
        Icons.cancel,
      ),
      'pending' => (
        AuroraColors.warning,
        tr('doc_status_pending'),
        Icons.schedule,
      ),
      _ => (AuroraColors.textSecondary, tr('doc_status_missing'), Icons.upload),
    };

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
              Icon(info.icon, color: AuroraColors.ember, size: 22),
              const SizedBox(width: AuroraSpacing.sm),
              Expanded(
                child: Text(tr(info.labelKey), style: AuroraText.titleSmall),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(AuroraRadius.sm),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(statusIcon, size: 12, color: statusColor),
                    const SizedBox(width: 4),
                    Text(statusLabel,
                        style: AuroraText.caption
                            .copyWith(color: statusColor)),
                  ],
                ),
              ),
            ],
          ),
          if (status == 'rejected' && rejectedReason != null) ...[
            const SizedBox(height: AuroraSpacing.sm),
            Container(
              padding: const EdgeInsets.all(AuroraSpacing.sm),
              decoration: BoxDecoration(
                color: AuroraColors.dangerBg,
                borderRadius: BorderRadius.circular(AuroraRadius.sm),
              ),
              child: Text(rejectedReason,
                  style: AuroraText.bodySmall
                      .copyWith(color: AuroraColors.danger)),
            ),
          ],
          const SizedBox(height: AuroraSpacing.sm),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: busy ? null : () => _uploadDoc(info),
              style: ElevatedButton.styleFrom(
                backgroundColor:
                    doc == null ? AuroraColors.ember : AuroraColors.ash,
              ),
              icon: Icon(doc == null ? Icons.upload : Icons.refresh, size: 18),
              label: Text(
                busy
                    ? tr('uploading')
                    : doc == null
                        ? tr('uploadDocument')
                        : tr('replaceDocument'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DocTypeInfo {
  final String type;
  final String labelKey;
  final IconData icon;
  const _DocTypeInfo(this.type, this.labelKey, this.icon);
}
