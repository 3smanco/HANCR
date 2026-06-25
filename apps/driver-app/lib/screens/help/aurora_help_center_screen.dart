import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/motion/motion.dart';
import '../../core/utils/external_launch.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraHelpCenterScreen — مركز المساعدة: دعوة سائقين + الأسئلة الشائعة + تواصل.
class AuroraHelpCenterScreen extends StatelessWidget {
  const AuroraHelpCenterScreen({super.key});

  static const _appLink = 'https://hancr.com/downloads/hancr-driver.apk';

  List<(String, String)> _faq() => [
    (tr('faqQ1'), tr('faqA1')),
    (tr('faqQ2'), tr('faqA2')),
    (tr('faqQ3'), tr('faqA3')),
    (tr('faqQ4'), tr('faqA4')),
  ];

  void _invite(BuildContext context) {
    final msg = '${tr('inviteShareText')}\n$_appLink';
    launchExternalUrl(
      context,
      'https://wa.me/?text=${Uri.encodeComponent(msg)}',
    );
  }

  Future<void> _copy(BuildContext context) async {
    await Clipboard.setData(const ClipboardData(text: _appLink));
    if (context.mounted) {
      Haptics.success();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(tr('linkCopied')),
          backgroundColor: AuroraColors.smoke,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(tr('helpCenter'), style: AuroraText.titleSmall),
        iconTheme: const IconThemeData(color: Color(0xFFFFF5EE)),
      ),
      body: AuroraBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            children: [
              // ─── دعوة سائقين ───
              Container(
                padding: const EdgeInsets.all(AuroraSpacing.lg),
                decoration: BoxDecoration(
                  gradient: AuroraColors.emberGradient,
                  borderRadius: BorderRadius.circular(AuroraRadius.xl),
                  boxShadow: AuroraShadows.emberGlow,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.card_giftcard,
                          color: Color(0xFFFFF5EE),
                          size: 22,
                        ),
                        const SizedBox(width: AuroraSpacing.sm),
                        Text(
                          tr('inviteCaptains'),
                          style: AuroraText.titleMedium.copyWith(
                            color: AuroraColors.pearl,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AuroraSpacing.sm),
                    Text(
                      tr('inviteDesc'),
                      style: AuroraText.bodyMedium.copyWith(
                        color: AuroraColors.pearl.withValues(alpha: 0.9),
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: AuroraSpacing.md),
                    Row(
                      children: [
                        Expanded(
                          child: _whiteBtn(
                            Icons.share,
                            tr('shareApp'),
                            () => _invite(context),
                          ),
                        ),
                        const SizedBox(width: AuroraSpacing.sm),
                        _whiteIconBtn(Icons.copy, () => _copy(context)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AuroraSpacing.xl),

              // ─── الأسئلة الشائعة ───
              Text(tr('faq'), style: AuroraText.titleSmall),
              const SizedBox(height: AuroraSpacing.sm),
              ..._faq().map((qa) => _FaqItem(question: qa.$1, answer: qa.$2)),

              const SizedBox(height: AuroraSpacing.xl),

              // ─── تواصل ───
              Text(tr('contactUs'), style: AuroraText.titleSmall),
              const SizedBox(height: AuroraSpacing.sm),
              AuroraCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    _contactRow(
                      Icons.email_outlined,
                      tr('contactEmail'),
                      () => launchSupportEmail(context, subject: 'دعم السائق'),
                    ),
                    const Divider(height: 1, color: AuroraColors.divider),
                    _contactRow(
                      Icons.chat,
                      tr('contactWhatsapp'),
                      () => launchSupportWhatsApp(context, text: 'دعم السائق'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AuroraSpacing.huge),
            ],
          ),
        ),
      ),
    );
  }

  Widget _whiteBtn(IconData icon, String label, VoidCallback onTap) {
    return Material(
      color: AuroraColors.pearl,
      borderRadius: BorderRadius.circular(AuroraRadius.md),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AuroraSpacing.sm),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: AuroraColors.emberDeep, size: 18),
              const SizedBox(width: 6),
              Text(
                label,
                style: AuroraText.buttonMedium.copyWith(
                  color: AuroraColors.emberDeep,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _whiteIconBtn(IconData icon, VoidCallback onTap) {
    return Material(
      color: AuroraColors.pearl.withValues(alpha: 0.25),
      borderRadius: BorderRadius.circular(AuroraRadius.md),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        child: Padding(
          padding: const EdgeInsets.all(AuroraSpacing.sm + 2),
          child: Icon(icon, color: AuroraColors.pearl, size: 18),
        ),
      ),
    );
  }

  Widget _contactRow(IconData icon, String label, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(AuroraSpacing.md),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AuroraColors.ember.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: AuroraColors.ember, size: 18),
              ),
              const SizedBox(width: AuroraSpacing.md),
              Expanded(child: Text(label, style: AuroraText.bodyLarge)),
              const Icon(
                Icons.chevron_left,
                color: AuroraColors.textSecondary,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FaqItem extends StatefulWidget {
  const _FaqItem({required this.question, required this.answer});
  final String question;
  final String answer;

  @override
  State<_FaqItem> createState() => _FaqItemState();
}

class _FaqItemState extends State<_FaqItem> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Column(
        children: [
          ListTile(
            title: Text(widget.question, style: AuroraText.titleSmall),
            trailing: Icon(
              _open ? Icons.expand_less : Icons.expand_more,
              color: AuroraColors.ember,
            ),
            onTap: () => setState(() => _open = !_open),
          ),
          AnimatedCrossFade(
            duration: Motion.fast,
            crossFadeState: _open
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            firstChild: const SizedBox(width: double.infinity),
            secondChild: Padding(
              padding: const EdgeInsets.fromLTRB(
                AuroraSpacing.md,
                0,
                AuroraSpacing.md,
                AuroraSpacing.md,
              ),
              child: Align(
                alignment: AlignmentDirectional.centerStart,
                child: Text(
                  widget.answer,
                  style: AuroraText.bodyMedium.copyWith(
                    color: AuroraColors.textSecondary,
                    height: 1.5,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
