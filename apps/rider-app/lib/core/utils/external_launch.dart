import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../i18n/app_localization.dart';
import '../widgets/aurora/aurora.dart';

/// أدوات فتح تطبيقات خارجية: الاتصال الهاتفي والملاحة (Google Maps / Waze).

/// يفتح طلب اتصال هاتفي بالرقم المعطى.
Future<void> launchPhoneCall(BuildContext context, String? phone) async {
  final clean = (phone ?? '').replaceAll(' ', '');
  if (clean.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(tr('noPhoneAvailable'))),
    );
    return;
  }
  final uri = Uri(scheme: 'tel', path: clean);
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri);
  } else if (context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(tr('cannotCall'))),
    );
  }
}

/// يعرض خياري الملاحة (Google Maps / Waze) ويفتح الوجهة المختارة.
Future<void> openExternalNav(
  BuildContext context,
  double lat,
  double lng, {
  String? label,
}) async {
  await showModalBottomSheet<void>(
    context: context,
    backgroundColor: AuroraColors.coal,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AuroraRadius.xl)),
    ),
    builder: (ctx) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: AuroraSpacing.md),
          Text(tr('navigateWith'),
              style: AuroraText.titleSmall.copyWith(color: AuroraColors.pearl)),
          const SizedBox(height: AuroraSpacing.sm),
          ListTile(
            leading: const Icon(Icons.map, color: AuroraColors.ember),
            title: Text(tr('googleMaps'),
                style: AuroraText.bodyMedium
                    .copyWith(color: AuroraColors.pearl)),
            onTap: () {
              Navigator.pop(ctx);
              _launch(context, Uri.parse(
                  'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=driving'));
            },
          ),
          ListTile(
            leading: const Icon(Icons.navigation, color: AuroraColors.info),
            title: Text(tr('waze'),
                style: AuroraText.bodyMedium
                    .copyWith(color: AuroraColors.pearl)),
            onTap: () {
              Navigator.pop(ctx);
              _launch(context,
                  Uri.parse('https://waze.com/ul?ll=$lat,$lng&navigate=yes'));
            },
          ),
          const SizedBox(height: AuroraSpacing.md),
        ],
      ),
    ),
  );
}

Future<void> _launch(BuildContext context, Uri uri) async {
  if (await canLaunchUrl(uri)) {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  } else if (context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(tr('cannotOpenMaps'))),
    );
  }
}
