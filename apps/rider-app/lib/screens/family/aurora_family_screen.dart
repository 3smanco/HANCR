import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// تدفّق العائلة (مستوحى من Family في Uber، بهوية HANCR). app-only:
/// صفحة دعوة → اختيار العمر → مشاركة دعوة.
class AuroraFamilyScreen extends StatelessWidget {
  const AuroraFamilyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final features = <(IconData, String, String)>[
      (Icons.shield_outlined, tr('famTeenSafety'), tr('famTeenSafetySub')),
      (Icons.timeline, tr('famFollow'), tr('famFollowSub')),
      (Icons.favorite_outline, tr('famPay'), tr('famPaySub')),
      (Icons.tune, tr('famLimits'), tr('famLimitsSub')),
    ];
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
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
                    ClipRRect(
                      borderRadius: BorderRadius.circular(AuroraRadius.lg),
                      child: Image.asset('assets/images/family-invite.png',
                          height: 180,
                          width: double.infinity,
                          fit: BoxFit.cover),
                    ),
                    const SizedBox(height: AuroraSpacing.lg),
                    Text(tr('famTitle'), style: AuroraText.displayMedium),
                    const SizedBox(height: AuroraSpacing.sm),
                    Text(tr('famSub'), style: AuroraText.bodyMedium),
                    const SizedBox(height: AuroraSpacing.xl),
                    ...features.map((f) => Padding(
                          padding:
                              const EdgeInsets.only(bottom: AuroraSpacing.md),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: AuroraColors.smoke,
                                  borderRadius:
                                      BorderRadius.circular(AuroraRadius.md),
                                ),
                                child: Icon(f.$1,
                                    color: AuroraColors.ember, size: 22),
                              ),
                              const SizedBox(width: AuroraSpacing.md),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(f.$2, style: AuroraText.titleSmall),
                                    const SizedBox(height: 2),
                                    Text(f.$3, style: AuroraText.bodySmall),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        )),
                  ],
                ),
              ),
              // زر سفلي ثابت
              Padding(
                padding: const EdgeInsets.all(AuroraSpacing.lg),
                child: AuroraButton.primary(
                  label: tr('inviteFamily'),
                  icon: Icons.group_add_outlined,
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(
                        builder: (_) => const _FamilyAgeScreen()),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FamilyAgeScreen extends StatefulWidget {
  const _FamilyAgeScreen();
  @override
  State<_FamilyAgeScreen> createState() => _FamilyAgeScreenState();
}

class _FamilyAgeScreenState extends State<_FamilyAgeScreen> {
  int _sel = 0; // 0 = adult, 1 = teen

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: AuroraColors.pearl),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
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
                    ClipRRect(
                      borderRadius: BorderRadius.circular(AuroraRadius.lg),
                      child: Image.asset('assets/images/family-start.png',
                          height: 170,
                          width: double.infinity,
                          fit: BoxFit.cover),
                    ),
                    const SizedBox(height: AuroraSpacing.lg),
                    Text(tr('famStart'), style: AuroraText.displayMedium),
                    const SizedBox(height: AuroraSpacing.xl),
                    _radio(0, tr('famAdult'), tr('famAdultSub')),
                    _radio(1, tr('famTeen'), tr('famTeenSub')),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AuroraSpacing.lg),
                child: AuroraButton.primary(
                  label: tr('continue_'),
                  onPressed: () {
                    Share.share(tr('famShareMsg'));
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                      content: Text(tr('famInviteSent')),
                      backgroundColor: AuroraColors.success,
                    ));
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _radio(int i, String title, String sub) {
    final sel = _sel == i;
    return GestureDetector(
      onTap: () => setState(() => _sel = i),
      child: Container(
        margin: const EdgeInsets.only(bottom: AuroraSpacing.md),
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        decoration: BoxDecoration(
          color: sel ? AuroraColors.smoke : AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.md),
          border: Border.all(
            color: sel ? AuroraColors.ember : AuroraColors.border,
            width: sel ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
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
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: sel ? AuroraColors.ember : AuroraColors.textSecondary,
                  width: 2,
                ),
              ),
              child: sel
                  ? Center(
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: AuroraColors.ember,
                          shape: BoxShape.circle,
                        ),
                      ),
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
