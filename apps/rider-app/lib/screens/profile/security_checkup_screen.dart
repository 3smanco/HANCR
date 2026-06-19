import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_state.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../sos/aurora_emergency_contacts_screen.dart';
import 'two_factor_screen.dart';
import 'devices_screen.dart';
import 'edit_profile_sheet.dart';

/// لوحة فحص الأمان — حلقة حالة (أخضر/برتقالي) + قائمة مهام تفاعلية مشتقة
/// من حالة الراكب. تُفتح من بطاقة "ابدأ الفحص".
class SecurityCheckupScreen extends StatelessWidget {
  const SecurityCheckupScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('securityCheckup'), style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: BlocBuilder<RiderBloc, RiderState>(
            builder: (context, state) {
              final rider = state is RiderLoaded ? state.rider : null;
              final twoFa = rider?.twoFactorEnabled ?? false;
              final hasEmail = (rider?.email ?? '').isNotEmpty;

              // البنود ذات الحالة المحدَّدة (تُحسب في النسبة)
              final scored = <bool>[twoFa, hasEmail];
              final done = scored.where((b) => b).length;
              final ratio = scored.isEmpty ? 1.0 : done / scored.length;
              final allGood = done == scored.length;

              return ListView(
                padding: const EdgeInsets.all(AuroraSpacing.lg),
                children: [
                  _statusRing(ratio, allGood, done, scored.length),
                  const SizedBox(height: AuroraSpacing.xl),
                  Text(tr('checkupTasks'), style: AuroraText.titleSmall),
                  const SizedBox(height: AuroraSpacing.md),
                  _task(
                    context,
                    icon: Icons.verified_user_outlined,
                    title: tr('twoFactor'),
                    subtitle: twoFa ? tr('twoFaOn') : tr('taskEnable2fa'),
                    done: twoFa,
                    onTap: () => Navigator.of(context)
                        .push(MaterialPageRoute(
                            builder: (_) => TwoFactorScreen(enabled: twoFa))),
                  ),
                  _task(
                    context,
                    icon: Icons.mail_outline,
                    title: tr('email'),
                    subtitle: hasEmail ? rider!.email! : tr('taskAddEmail'),
                    done: hasEmail,
                    onTap: () => showEditProfileSheet(context),
                  ),
                  _task(
                    context,
                    icon: Icons.contacts_outlined,
                    title: tr('trustedContacts'),
                    subtitle: tr('taskTrustedContact'),
                    done: null,
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => const AuroraEmergencyContactsScreen())),
                  ),
                  _task(
                    context,
                    icon: Icons.devices_outlined,
                    title: tr('myDevices'),
                    subtitle: tr('taskReviewDevices'),
                    done: null,
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => const DevicesScreen())),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _statusRing(double ratio, bool allGood, int done, int total) {
    final color = allGood ? AuroraColors.success : AuroraColors.warning;
    return Center(
      child: Column(
        children: [
          SizedBox(
            width: 132,
            height: 132,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 132,
                  height: 132,
                  child: CircularProgressIndicator(
                    value: ratio,
                    strokeWidth: 8,
                    backgroundColor: AuroraColors.smoke,
                    valueColor: AlwaysStoppedAnimation(color),
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(allGood ? Icons.shield : Icons.shield_outlined,
                        color: color, size: 34),
                    const SizedBox(height: 4),
                    Text('$done/$total',
                        style: AuroraText.titleSmall.copyWith(color: color)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: AuroraSpacing.md),
          Text(allGood ? tr('checkupAllGood') : tr('checkupHasGaps'),
              textAlign: TextAlign.center,
              style: AuroraText.bodyMedium.copyWith(
                  color: allGood ? AuroraColors.success : AuroraColors.warning)),
        ],
      ),
    );
  }

  Widget _task(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required bool? done,
    required VoidCallback onTap,
  }) {
    final Widget trailing;
    if (done == true) {
      trailing = Icon(Icons.check_circle, color: AuroraColors.success, size: 22);
    } else if (done == false) {
      trailing = Icon(Icons.error_outline, color: AuroraColors.warning, size: 22);
    } else {
      trailing = const Icon(Icons.chevron_left,
          color: AuroraColors.textSecondary, size: 20);
    }
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(
          color: done == false ? AuroraColors.warning : AuroraColors.border,
          width: done == false ? 1.2 : 1,
        ),
      ),
      child: ListTile(
        leading: Icon(icon, color: AuroraColors.ember),
        title: Text(title,
            style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl)),
        subtitle: Text(subtitle, style: AuroraText.caption),
        trailing: trailing,
        onTap: onTap,
      ),
    );
  }
}
