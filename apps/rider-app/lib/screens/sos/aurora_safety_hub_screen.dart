import 'package:flutter/material.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';
import 'aurora_emergency_contacts_screen.dart';

/// AuroraSafetyHubScreen — مركز الأمان (مستوحى من Safety Hub في Uber لكن بهوية
/// HANCR الداكنة: ember بدل الأزرق). يجمع أدوات الأمان في مكان واحد.
class AuroraSafetyHubScreen extends StatelessWidget {
  const AuroraSafetyHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(AuroraSpacing.lg, 0,
                AuroraSpacing.lg, AuroraSpacing.xl),
            children: [
              // ─── Hero ───
              const SizedBox(height: AuroraSpacing.sm),
              Row(
                children: [
                  _closeButton(context),
                ],
              ),
              const SizedBox(height: AuroraSpacing.md),
              Center(
                child: Container(
                  width: 84,
                  height: 84,
                  decoration: BoxDecoration(
                    gradient: AuroraColors.emberGradient,
                    shape: BoxShape.circle,
                    boxShadow: AuroraShadows.emberGlow,
                  ),
                  child: Icon(Icons.shield_outlined,
                      color: AuroraColors.pearl, size: 42),
                ),
              ),
              const SizedBox(height: AuroraSpacing.md),
              Center(
                child: Text(tr('safetyHub'),
                    style: AuroraText.displayMedium, textAlign: TextAlign.center),
              ),
              const SizedBox(height: AuroraSpacing.xl),

              // ─── Safety tools ───
              _sectionLabel(tr('safetyTools')),
              _toolRow(
                icon: Icons.tune,
                title: tr('safetyPreferences'),
                subtitle: tr('safetyPreferencesSub'),
                onTap: () => _push(context, const _SafetyPreferencesScreen()),
              ),
              _toolRow(
                icon: Icons.contacts_outlined,
                title: tr('trustedContacts'),
                subtitle: tr('trustedContactsSub'),
                onTap: () =>
                    _push(context, const AuroraEmergencyContactsScreen()),
              ),
              _toolRow(
                icon: Icons.pin_outlined,
                title: tr('pinVerification'),
                subtitle: tr('pinVerificationSub'),
                onTap: () => _push(
                  context,
                  _SafetyInfoScreen(
                    title: tr('pinVerification'),
                    icon: Icons.pin_outlined,
                    body: tr('pinVerificationBody'),
                  ),
                ),
              ),
              _toolRow(
                icon: Icons.directions_car_outlined,
                title: tr('rideCheck'),
                subtitle: tr('rideCheckSub'),
                onTap: () => _push(
                  context,
                  _SafetyInfoScreen(
                    title: tr('rideCheck'),
                    icon: Icons.directions_car_outlined,
                    body: tr('rideCheckBody'),
                  ),
                ),
              ),

              const SizedBox(height: AuroraSpacing.lg),

              // ─── Know before your ride ───
              _sectionLabel(tr('knowBeforeRide')),
              _toolRow(
                icon: Icons.verified_user_outlined,
                title: tr('safetyTips'),
                subtitle: tr('safetyTipsSub'),
                onTap: () => _push(
                  context,
                  _SafetyInfoScreen(
                    title: tr('safetyTips'),
                    icon: Icons.verified_user_outlined,
                    bullets: [
                      tr('safetyTip1'),
                      tr('safetyTip2'),
                      tr('safetyTip3'),
                      tr('safetyTip4'),
                    ],
                  ),
                ),
              ),
              _toolRow(
                icon: Icons.favorite_outline,
                title: tr('safetyAtHancr'),
                subtitle: tr('safetyAtHancrSub'),
                onTap: () => _push(
                  context,
                  _SafetyInfoScreen(
                    title: tr('safetyAtHancr'),
                    icon: Icons.favorite_outline,
                    body: tr('safetyAtHancrBody'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionLabel(String t) => Padding(
        padding: const EdgeInsets.only(bottom: AuroraSpacing.md, top: 4),
        child: Text(t, style: AuroraText.titleMedium),
      );

  Widget _toolRow({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      child: AuroraCard(
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AuroraColors.smoke,
                borderRadius: BorderRadius.circular(AuroraRadius.md),
              ),
              child: Icon(icon, color: AuroraColors.ember, size: 22),
            ),
            const SizedBox(width: AuroraSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AuroraText.titleSmall),
                  const SizedBox(height: 2),
                  Text(subtitle, style: AuroraText.bodySmall),
                ],
              ),
            ),
            const Icon(Icons.chevron_left,
                color: AuroraColors.textSecondary, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _closeButton(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        shape: BoxShape.circle,
        border: Border.all(color: AuroraColors.border),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => Navigator.of(context).maybePop(),
          customBorder: const CircleBorder(),
          child: Icon(Icons.close, color: AuroraColors.pearl, size: 20),
        ),
      ),
    );
  }

  static void _push(BuildContext context, Widget page) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
  }
}

// ════════════════════════════════════════════════════════════════
// تفضيلات الأمان — مفاتيح محلية
// ════════════════════════════════════════════════════════════════
class _SafetyPreferencesScreen extends StatefulWidget {
  const _SafetyPreferencesScreen();
  @override
  State<_SafetyPreferencesScreen> createState() =>
      _SafetyPreferencesScreenState();
}

class _SafetyPreferencesScreenState extends State<_SafetyPreferencesScreen> {
  bool _autoShare = false;
  bool _pinRequired = false;
  bool _rideCheck = true;

  @override
  Widget build(BuildContext context) {
    return _SafetyScaffold(
      title: tr('safetyPreferences'),
      child: ListView(
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        children: [
          _switchRow(tr('prefAutoShare'), tr('prefAutoShareSub'), _autoShare,
              (v) => setState(() => _autoShare = v)),
          _switchRow(tr('prefPinRequired'), tr('prefPinRequiredSub'),
              _pinRequired, (v) => setState(() => _pinRequired = v)),
          _switchRow(tr('prefRideCheck'), tr('prefRideCheckSub'), _rideCheck,
              (v) => setState(() => _rideCheck = v)),
        ],
      ),
    );
  }

  Widget _switchRow(String label, String sub, bool value,
      ValueChanged<bool> onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.symmetric(
          horizontal: AuroraSpacing.lg, vertical: AuroraSpacing.sm),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: AuroraText.bodyMedium),
                const SizedBox(height: 2),
                Text(sub, style: AuroraText.caption),
              ],
            ),
          ),
          Switch(
              value: value,
              onChanged: onChanged,
              activeColor: AuroraColors.ember),
        ],
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════
// شاشة معلومات أمان عامة (نص أو نقاط)
// ════════════════════════════════════════════════════════════════
class _SafetyInfoScreen extends StatelessWidget {
  const _SafetyInfoScreen({
    required this.title,
    required this.icon,
    this.body,
    this.bullets,
  });
  final String title;
  final IconData icon;
  final String? body;
  final List<String>? bullets;

  @override
  Widget build(BuildContext context) {
    return _SafetyScaffold(
      title: title,
      child: ListView(
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        children: [
          const SizedBox(height: AuroraSpacing.sm),
          Center(
            child: Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                gradient: AuroraColors.emberGradient,
                shape: BoxShape.circle,
                boxShadow: AuroraShadows.emberGlow,
              ),
              child: Icon(icon, color: AuroraColors.pearl, size: 36),
            ),
          ),
          const SizedBox(height: AuroraSpacing.lg),
          if (body != null)
            Text(body!,
                style: AuroraText.bodyMedium
                    .copyWith(color: AuroraColors.textSecondary, height: 1.6)),
          if (bullets != null)
            ...bullets!.map((b) => Padding(
                  padding: const EdgeInsets.only(bottom: AuroraSpacing.md),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.check_circle,
                          color: AuroraColors.ember, size: 20),
                      const SizedBox(width: AuroraSpacing.sm),
                      Expanded(
                        child: Text(b,
                            style: AuroraText.bodyMedium
                                .copyWith(height: 1.5)),
                      ),
                    ],
                  ),
                )),
        ],
      ),
    );
  }
}

/// Scaffold موحّد لشاشات الأمان الفرعية.
class _SafetyScaffold extends StatelessWidget {
  const _SafetyScaffold({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(title, style: AuroraText.titleMedium),
        iconTheme: IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(child: SafeArea(top: false, child: child)),
    );
  }
}
