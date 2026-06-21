import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
 import '../../core/motion/motion.dart';

/// أجهزة/جلسات الراكب — عرض وإبطال جهاز بعينه (مرتبط بالخادم).
class DevicesScreen extends StatefulWidget {
  const DevicesScreen({super.key});

  @override
  State<DevicesScreen> createState() => _DevicesScreenState();
}

class _DevicesScreenState extends State<DevicesScreen> {
  List<Map<String, dynamic>> _devices = [];
  bool _loading = true;
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
        document: gql(myDevicesQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      if (res.hasException) throw res.exception!;
      if (!mounted) return;
      setState(() {
        _devices = (res.data?['myDevices'] as List?)
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

  Future<void> _revoke(int id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        content: Text(tr('revokeDeviceConfirm'), style: AuroraText.bodyMedium),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(tr('cancel'),
                style: TextStyle(color: AuroraColors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child:
                Text(tr('confirm'), style: TextStyle(color: AuroraColors.danger)),
          ),
        ],
      ),
    );
    if (ok != true) return;
    final client = await GraphQLClientManager.get();
    await client.mutate(MutationOptions(
      document: gql(revokeDeviceMutation),
      variables: {'deviceId': id},
    ));
    await _load();
  }

  Future<void> _revokeOthers() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        content:
            Text(tr('signOutOthersConfirm'), style: AuroraText.bodyMedium),
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
    if (ok != true) return;
    final client = await GraphQLClientManager.get();
    await client.mutate(
        MutationOptions(document: gql(revokeOtherDevicesMutation)));
    await _load();
  }

  IconData _platformIcon(String? p) {
    switch (p) {
      case 'ios':
        return Icons.phone_iphone;
      case 'web':
        return Icons.language;
      default:
        return Icons.phone_android;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('myDevices'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: _loading
              ? Center(
                  child: AuroraLoader(size: 36))
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
                        Text(tr('devicesInfo'),
                            style:
                                AuroraText.bodySmall.copyWith(height: 1.5)),
                        const SizedBox(height: AuroraSpacing.md),
                        if (_devices.where((d) => d['current'] != true)
                            .isNotEmpty) ...[
                          AuroraButton.secondary(
                            label: tr('signOutOthers'),
                            icon: Icons.logout,
                            onPressed: _revokeOthers,
                          ),
                          const SizedBox(height: AuroraSpacing.lg),
                        ],
                        ..._devices.map(_deviceTile),
                        if (_devices.isEmpty)
                          Padding(
                            padding: const EdgeInsets.only(
                                top: AuroraSpacing.xl),
                            child: Center(
                              child: Text(tr('noDevices'),
                                  style: AuroraText.bodySmall),
                            ),
                          ),
                      ],
                    ),
        ),
      ),
    );
  }

  Widget _deviceTile(Map<String, dynamic> d) {
    final current = d['current'] == true;
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(
            color: current ? AuroraColors.ember : AuroraColors.border),
      ),
      child: Row(
        children: [
          Icon(_platformIcon(d['platform'] as String?),
              color: AuroraColors.ember, size: 24),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(d['deviceName'] as String? ?? tr('unknownDevice'),
                    style: AuroraText.bodyMedium
                        .copyWith(color: AuroraColors.pearl)),
                Text(
                    current
                        ? tr('thisDevice')
                        : (d['platform'] as String? ?? ''),
                    style: AuroraText.caption.copyWith(
                        color: current
                            ? AuroraColors.ember
                            : AuroraColors.textSecondary)),
              ],
            ),
          ),
          if (!current)
            TextButton(
              onPressed: () => _revoke(d['id'] as int),
              child: Text(tr('revoke'),
                  style: TextStyle(color: AuroraColors.danger)),
            ),
        ],
      ),
    );
  }
}
