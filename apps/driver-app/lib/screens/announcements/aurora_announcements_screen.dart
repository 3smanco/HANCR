import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:intl/intl.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/driver_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/utils/external_launch.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraAnnouncementsScreen — أخبار وإعلانات السائق (driverAnnouncements).
class AuroraAnnouncementsScreen extends StatefulWidget {
  const AuroraAnnouncementsScreen({super.key});

  @override
  State<AuroraAnnouncementsScreen> createState() =>
      _AuroraAnnouncementsScreenState();
}

class _AuroraAnnouncementsScreenState extends State<AuroraAnnouncementsScreen> {
  List<Map<String, dynamic>> _items = [];
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
        document: gql(driverAnnouncementsQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (!mounted) return;
      setState(() {
        _items = ((res.data?['driverAnnouncements'] as List<dynamic>?) ?? [])
            .cast<Map<String, dynamic>>();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('announcements'), style: AuroraText.titleSmall),
        iconTheme: const IconThemeData(color: Color(0xFFFFF5EE)),
      ),
      body: AuroraBackground(
        child: SafeArea(
          child: _loading
              ? Center(
                  child:
                      CircularProgressIndicator(color: AuroraColors.ember))
              : _items.isEmpty
                  ? _empty()
                  : RefreshIndicator(
                      color: AuroraColors.ember,
                      backgroundColor: AuroraColors.ash,
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(AuroraSpacing.lg),
                        itemCount: _items.length,
                        separatorBuilder: (_, _) =>
                            const SizedBox(height: AuroraSpacing.sm),
                        itemBuilder: (_, i) => _card(_items[i]),
                      ),
                    ),
        ),
      ),
    );
  }

  Widget _empty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.campaign_outlined, size: 56, color: AuroraColors.textHint),
          const SizedBox(height: AuroraSpacing.md),
          Text(tr('noAnnouncements'), style: AuroraText.bodyMedium),
        ],
      ),
    );
  }

  Widget _card(Map<String, dynamic> a) {
    final url = a['url'] as String?;
    final created = a['createdAt'] as String?;
    final date = created != null
        ? DateFormat('d MMM', 'ar').format(DateTime.parse(created))
        : '';
    return AuroraCard(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      onTap: (url != null && url.isNotEmpty)
          ? () => launchExternalUrl(context, url)
          : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.campaign, color: AuroraColors.ember, size: 18),
              const SizedBox(width: AuroraSpacing.sm),
              Expanded(
                child: Text(a['title'] as String? ?? '',
                    style: AuroraText.titleSmall),
              ),
              Text(date, style: AuroraText.caption),
            ],
          ),
          const SizedBox(height: AuroraSpacing.sm),
          Text(a['body'] as String? ?? '',
              style: AuroraText.bodyMedium
                  .copyWith(color: AuroraColors.textSecondary, height: 1.5)),
          if (url != null && url.isNotEmpty) ...[
            const SizedBox(height: AuroraSpacing.sm),
            Row(
              children: [
                Text(tr('learnMore'),
                    style: AuroraText.bodySmall
                        .copyWith(color: AuroraColors.ember)),
                const SizedBox(width: 4),
                Icon(Icons.open_in_new, color: AuroraColors.ember, size: 14),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
