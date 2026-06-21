import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/graphql/gql/company_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/services/storage_service.dart';
import '../../core/widgets/aurora/aurora.dart';
 import '../../core/motion/motion.dart';

/// ملفات الركوب — التبديل بين الشخصي والأعمال (Company F2).
class RideProfilesScreen extends StatefulWidget {
  const RideProfilesScreen({super.key});

  @override
  State<RideProfilesScreen> createState() => _RideProfilesScreenState();
}

class _RideProfilesScreenState extends State<RideProfilesScreen> {
  Map<String, dynamic>? _company;
  String _selected = 'personal';
  bool _loading = true;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    _selected = await StorageService.getRideProfile() ?? 'personal';
    await _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(myCompanyQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (!mounted) return;
      _company = res.data?['myCompany'] as Map<String, dynamic>?;
      // إن لا شركة، أعِد للشخصي
      if (_company == null && _selected == 'business') _selected = 'personal';
    } catch (_) {
      // تجاهل — يبقى الشخصي
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _select(String profile) async {
    if (profile == 'business' && _company == null) {
      await _setupBusiness();
      if (_company == null) return; // أُلغي/فشل
    }
    setState(() => _selected = profile);
    await StorageService.saveRideProfile(profile);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(tr('profileApplied')),
        backgroundColor: AuroraColors.success,
      ));
    }
  }

  Future<void> _setupBusiness() async {
    final nameCtl = TextEditingController();
    final emailCtl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        title: Text(tr('setupBusiness'), style: AuroraText.titleSmall),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtl,
              style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
              decoration: InputDecoration(hintText: tr('businessNameHint')),
            ),
            TextField(
              controller: emailCtl,
              keyboardType: TextInputType.emailAddress,
              style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
              decoration: InputDecoration(hintText: tr('billingEmailHint')),
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
    if (ok != true || nameCtl.text.trim().isEmpty) return;
    setState(() => _busy = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(setupBusinessProfileMutation),
        variables: {
          'name': nameCtl.text.trim(),
          if (emailCtl.text.trim().isNotEmpty)
            'billingEmail': emailCtl.text.trim(),
        },
      ));
      if (res.hasException) throw res.exception!;
      if (!mounted) return;
      setState(() => _company =
          res.data?['setupBusinessProfile'] as Map<String, dynamic>?);
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
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('rideProfiles'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: _loading
              ? Center(
                  child: AuroraLoader(size: 36))
              : ListView(
                  padding: const EdgeInsets.all(AuroraSpacing.lg),
                  children: [
                    Text(tr('rideProfilesInfo'),
                        style: AuroraText.bodySmall.copyWith(height: 1.5)),
                    const SizedBox(height: AuroraSpacing.lg),
                    _profileTile(
                      'personal',
                      Icons.person_outline,
                      tr('profilePersonal'),
                      tr('profilePersonalSub'),
                    ),
                    _profileTile(
                      'business',
                      Icons.business_center_outlined,
                      _company?['companyName'] as String? ??
                          tr('profileBusiness'),
                      _company == null
                          ? tr('setupBusiness')
                          : tr('profileBusinessSub'),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _profileTile(
      String value, IconData icon, String title, String sub) {
    final sel = _selected == value;
    return GestureDetector(
      onTap: _busy ? null : () => _select(value),
      child: Container(
        margin: const EdgeInsets.only(bottom: AuroraSpacing.md),
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        decoration: BoxDecoration(
          color: sel ? AuroraColors.smoke : AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          border: Border.all(
              color: sel ? AuroraColors.ember : AuroraColors.border,
              width: sel ? 1.5 : 1),
        ),
        child: Row(
          children: [
            Icon(icon, color: AuroraColors.ember, size: 24),
            const SizedBox(width: AuroraSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AuroraText.titleSmall),
                  const SizedBox(height: 2),
                  Text(sub, style: AuroraText.bodySmall),
                ],
              ),
            ),
            if (sel) Icon(Icons.check_circle, color: AuroraColors.ember),
          ],
        ),
      ),
    );
  }
}
