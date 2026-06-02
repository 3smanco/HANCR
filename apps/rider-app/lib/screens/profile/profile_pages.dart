import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_event.dart';
import '../../blocs/rider/rider_state.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/auth_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/widgets/aurora/aurora.dart';

/// Scaffold موحّد لصفحات الحساب الفرعية بنمط Aurora.
class _AuroraPage extends StatelessWidget {
  final String title;
  final Widget child;
  const _AuroraPage({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        title: Text(title, style: AuroraText.titleMedium),
        iconTheme: const IconThemeData(color: AuroraColors.pearl),
      ),
      body: AuroraBackground(child: SafeArea(top: false, child: child)),
    );
  }
}

// ════════════════════════════════════════════════════════════════
// 1) تعديل الملف الشخصي — يحفظ عبر RiderBloc/API
// ════════════════════════════════════════════════════════════════
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});
  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  bool _seeded = false;

  void _seed(RiderState state) {
    if (_seeded || state is! RiderLoaded) return;
    _first.text = state.rider.firstName ?? '';
    _last.text = state.rider.lastName ?? '';
    _email.text = state.rider.email ?? '';
    _seeded = true;
  }

  void _save() {
    context.read<RiderBloc>().add(RiderUpdateRequested(
          firstName: _first.text.trim(),
          lastName: _last.text.trim(),
          email: _email.text.trim().isEmpty ? null : _email.text.trim(),
        ));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(tr('saved')),
        backgroundColor: AuroraColors.success,
      ),
    );
    Navigator.of(context).maybePop();
  }

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _AuroraPage(
      title: tr('editProfile'),
      child: BlocBuilder<RiderBloc, RiderState>(
        builder: (context, state) {
          _seed(state);
          return ListView(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            children: [
              _field(tr('firstName'), _first, Icons.person_outline),
              const SizedBox(height: AuroraSpacing.md),
              _field(tr('lastName'), _last, Icons.person_outline),
              const SizedBox(height: AuroraSpacing.md),
              _field(tr('email'), _email, Icons.mail_outline,
                  keyboard: TextInputType.emailAddress),
              const SizedBox(height: AuroraSpacing.xl),
              AuroraButton.primary(
                  label: tr('save'), icon: Icons.check, onPressed: _save),
            ],
          );
        },
      ),
    );
  }

  Widget _field(String label, TextEditingController c, IconData icon,
      {TextInputType? keyboard}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AuroraText.bodySmall),
        const SizedBox(height: 6),
        TextField(
          controller: c,
          keyboardType: keyboard,
          style: AuroraText.bodyMedium.copyWith(color: AuroraColors.pearl),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: AuroraColors.textSecondary, size: 20),
            filled: true,
            fillColor: AuroraColors.ash,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AuroraRadius.md),
              borderSide: const BorderSide(color: AuroraColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AuroraRadius.md),
              borderSide: const BorderSide(color: AuroraColors.ember, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}

// ════════════════════════════════════════════════════════════════
// 2) مركز المساعدة — FAQ + تواصل
// ════════════════════════════════════════════════════════════════
class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final faqs = <(String, String)>[
      (tr('faqQ1'), tr('faqA1')),
      (tr('faqQ2'), tr('faqA2')),
      (tr('faqQ3'), tr('faqA3')),
      (tr('faqQ4'), tr('faqA4')),
      (tr('faqQ5'), tr('faqA5')),
    ];
    return _AuroraPage(
      title: tr('helpCenter'),
      child: ListView(
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        children: [
          Text(tr('faq'), style: AuroraText.titleMedium),
          const SizedBox(height: AuroraSpacing.md),
          ...faqs.map((f) => Container(
                margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
                decoration: BoxDecoration(
                  color: AuroraColors.ash,
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  border: Border.all(color: AuroraColors.border),
                ),
                child: Theme(
                  data: Theme.of(context)
                      .copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    iconColor: AuroraColors.ember,
                    collapsedIconColor: AuroraColors.textSecondary,
                    title: Text(f.$1, style: AuroraText.titleSmall),
                    childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    children: [
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(f.$2, style: AuroraText.bodySmall),
                      ),
                    ],
                  ),
                ),
              )),
          const SizedBox(height: AuroraSpacing.lg),
          Text(tr('contactUs'), style: AuroraText.titleMedium),
          const SizedBox(height: AuroraSpacing.md),
          _contactRow(context, Icons.email_outlined, 'support@hancr.com'),
          const SizedBox(height: AuroraSpacing.sm),
          _contactRow(context, Icons.phone_outlined, '+966 50 000 0000'),
        ],
      ),
    );
  }

  Widget _contactRow(BuildContext context, IconData icon, String value) {
    return GestureDetector(
      onTap: () {
        Clipboard.setData(ClipboardData(text: value));
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${tr('copied')}: $value'),
            backgroundColor: AuroraColors.smoke,
          ),
        );
      },
      child: AuroraCard(
        child: Row(
          children: [
            Icon(icon, color: AuroraColors.ember, size: 20),
            const SizedBox(width: AuroraSpacing.md),
            Expanded(child: Text(value, style: AuroraText.bodyMedium)),
            const Icon(Icons.copy, color: AuroraColors.textSecondary, size: 16),
          ],
        ),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════
// 3) ادعُ أصدقاءك — كود إحالة
// ════════════════════════════════════════════════════════════════
class InviteFriendsScreen extends StatefulWidget {
  const InviteFriendsScreen({super.key});

  @override
  State<InviteFriendsScreen> createState() => _InviteFriendsScreenState();
}

class _InviteFriendsScreenState extends State<InviteFriendsScreen> {
  String? _code;
  int _referredCount = 0;
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
        document: gql(myReferralQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final d = res.data?['myReferral'] as Map<String, dynamic>?;
      if (!mounted) return;
      setState(() {
        _code = d?['code'] as String?;
        _referredCount = (d?['referredCount'] as int?) ?? 0;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  void _copy() {
    if (_code == null) return;
    Clipboard.setData(ClipboardData(text: _code!));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(tr('codeCopied')),
        backgroundColor: AuroraColors.success,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return _AuroraPage(
      title: tr('inviteFriends'),
      child: _loading
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(AuroraSpacing.xxl),
                child: CircularProgressIndicator(color: AuroraColors.ember),
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(AuroraSpacing.lg),
              children: [
                const SizedBox(height: AuroraSpacing.lg),
                Center(
                  child: Container(
                    width: 96,
                    height: 96,
                    decoration: BoxDecoration(
                      gradient: AuroraColors.emberGradient,
                      shape: BoxShape.circle,
                      boxShadow: AuroraShadows.emberGlow,
                    ),
                    child: const Icon(Icons.card_giftcard,
                        color: AuroraColors.pearl, size: 44),
                  ),
                ),
                const SizedBox(height: AuroraSpacing.lg),
                Text(tr('inviteHeadline'),
                    textAlign: TextAlign.center,
                    style: AuroraText.titleMedium),
                const SizedBox(height: 6),
                Text(
                  tr('inviteDesc'),
                  textAlign: TextAlign.center,
                  style: AuroraText.bodySmall,
                ),
                const SizedBox(height: AuroraSpacing.xl),
                Container(
                  padding: const EdgeInsets.all(AuroraSpacing.lg),
                  decoration: BoxDecoration(
                    color: AuroraColors.ash,
                    borderRadius: BorderRadius.circular(AuroraRadius.md),
                    border: Border.all(color: AuroraColors.ember),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(_code ?? '—',
                          style: AuroraText.titleMedium.copyWith(
                              color: AuroraColors.ember, letterSpacing: 2)),
                      GestureDetector(
                        onTap: _copy,
                        child:
                            const Icon(Icons.copy, color: AuroraColors.pearl),
                      ),
                    ],
                  ),
                ),
                if (_referredCount > 0) ...[
                  const SizedBox(height: AuroraSpacing.md),
                  Text(
                    '${tr('friendsInvited')}: $_referredCount',
                    textAlign: TextAlign.center,
                    style: AuroraText.bodySmall
                        .copyWith(color: AuroraColors.textSecondary),
                  ),
                ],
                const SizedBox(height: AuroraSpacing.xl),
                AuroraButton.primary(
                  label: tr('shareCode'),
                  icon: Icons.share,
                  onPressed: _copy,
                ),
              ],
            ),
    );
  }
}

// ════════════════════════════════════════════════════════════════
// 4) الإعدادات
// ════════════════════════════════════════════════════════════════
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notif = true;
  bool _promo = true;

  @override
  Widget build(BuildContext context) {
    return _AuroraPage(
      title: tr('settings'),
      child: ListView(
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        children: [
          _sectionLabel(tr('notifications')),
          _switchRow(tr('rideNotifs'), _notif, (v) => setState(() => _notif = v)),
          _switchRow(tr('promoNotifs'), _promo, (v) => setState(() => _promo = v)),
          const SizedBox(height: AuroraSpacing.lg),
          _sectionLabel(tr('language')),
          // مبدّل اللغة
          Container(
            margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
            decoration: BoxDecoration(
              color: AuroraColors.ash,
              borderRadius: BorderRadius.circular(AuroraRadius.md),
              border: Border.all(color: AuroraColors.border),
            ),
            child: ListTile(
              leading: const Icon(Icons.translate, color: AuroraColors.ember),
              title: Text(LocaleController.instance.currentLanguage.nativeName,
                  style: AuroraText.bodyMedium
                      .copyWith(color: AuroraColors.pearl)),
              trailing: const Icon(Icons.chevron_left,
                  color: AuroraColors.textSecondary),
              onTap: () async {
                await Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => const LanguageScreen()));
                if (mounted) setState(() {});
              },
            ),
          ),
          const SizedBox(height: AuroraSpacing.lg),
          _sectionLabel(tr('about')),
          _infoRow(tr('version'), '1.0.0'),
          _infoRow('hancr.com', 'hancr.com'),
        ],
      ),
    );
  }

  Widget _sectionLabel(String t) => Padding(
        padding: const EdgeInsets.only(bottom: AuroraSpacing.sm),
        child: Text(t,
            style: AuroraText.bodySmall.copyWith(color: AuroraColors.ember)),
      );

  Widget _switchRow(String label, bool value, ValueChanged<bool> onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Row(
        children: [
          Expanded(child: Text(label, style: AuroraText.bodyMedium)),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AuroraColors.ember,
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Row(
        children: [
          Expanded(child: Text(label, style: AuroraText.bodyMedium)),
          Text(value, style: AuroraText.bodySmall),
        ],
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════
// 5) اختيار اللغة (8 لغات)
// ════════════════════════════════════════════════════════════════
class LanguageScreen extends StatefulWidget {
  const LanguageScreen({super.key});
  @override
  State<LanguageScreen> createState() => _LanguageScreenState();
}

class _LanguageScreenState extends State<LanguageScreen> {
  @override
  Widget build(BuildContext context) {
    final current = LocaleController.instance.value.languageCode;
    return _AuroraPage(
      title: tr('selectLanguage'),
      child: ListView(
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        children: kSupportedLanguages.map((lang) {
          final selected = lang.code == current;
          return GestureDetector(
            onTap: () async {
              await LocaleController.instance.setLanguage(lang.code);
              if (context.mounted) setState(() {});
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
              padding: const EdgeInsets.all(AuroraSpacing.md),
              decoration: BoxDecoration(
                color: selected ? AuroraColors.smoke : AuroraColors.ash,
                borderRadius: BorderRadius.circular(AuroraRadius.md),
                border: Border.all(
                  color: selected ? AuroraColors.ember : AuroraColors.border,
                  width: selected ? 1.5 : 1,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AuroraColors.coal,
                      borderRadius: BorderRadius.circular(AuroraRadius.sm),
                    ),
                    child: Text(lang.code.toUpperCase().substring(0, 2),
                        style: AuroraText.caption
                            .copyWith(color: AuroraColors.ember)),
                  ),
                  const SizedBox(width: AuroraSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(lang.nativeName, style: AuroraText.titleSmall),
                        Text(lang.englishName, style: AuroraText.caption),
                      ],
                    ),
                  ),
                  if (selected)
                    const Icon(Icons.check_circle, color: AuroraColors.ember),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
