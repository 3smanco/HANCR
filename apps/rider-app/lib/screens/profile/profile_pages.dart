import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../blocs/auth/auth_event.dart';
import '../../blocs/rider/rider_bloc.dart';
import '../../blocs/rider/rider_event.dart';
import '../../blocs/rider/rider_state.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/auth_gql.dart';
import '../../core/graphql/gql/order_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/models/order_model.dart';
import '../../core/services/storage_service.dart';
import '../../core/account_version.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/widgets/rider_avatar.dart';
import '../rides/aurora_rides.dart';
import 'aurora_saved_places_screen.dart';
import 'account_management_screen.dart';
import 'appearance_screen.dart';
import 'choose_team_screen.dart';

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
        iconTheme: IconThemeData(color: AuroraColors.pearl),
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
          final name = [_first.text, _last.text]
              .where((s) => s.isNotEmpty)
              .join(' ');
          final avatarUrl =
              state is RiderLoaded ? state.rider.avatarUrl : null;
          return ListView(
            padding: const EdgeInsets.all(AuroraSpacing.lg),
            children: [
              Center(
                child: RiderAvatar(
                  avatarUrl: avatarUrl,
                  initial: name.isNotEmpty ? name[0].toUpperCase() : '?',
                  size: 96,
                ),
              ),
              const SizedBox(height: AuroraSpacing.xl),
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
              borderSide: BorderSide(color: AuroraColors.ember, width: 1.5),
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
          // ─── اختر رحلة لحل مشكلتها ───
          const _HelpRecentRides(),
          // ─── تصفّح مواضيع المساعدة ───
          const _HelpTopics(),
          const SizedBox(height: AuroraSpacing.lg),
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

// ─── "اختر رحلة" — آخر الرحلات لحل مشكلتها (جلب محلي مستقل عن OrderBloc) ───
class _HelpRecentRides extends StatefulWidget {
  const _HelpRecentRides();
  @override
  State<_HelpRecentRides> createState() => _HelpRecentRidesState();
}

class _HelpRecentRidesState extends State<_HelpRecentRides> {
  bool _loading = true;
  List<OrderModel> _rides = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(orderHistoryQuery),
        variables: const {'limit': 3, 'offset': 0},
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final list = (res.data?['orderHistory'] as List?) ?? [];
      if (!mounted) return;
      setState(() {
        _rides = list
            .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
            .toList();
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading || _rides.isEmpty) return const SizedBox.shrink();
    final df = DateFormat('d MMM • h:mm a', 'ar');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(tr('selectARide'), style: AuroraText.titleMedium),
            GestureDetector(
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const RidesHistoryScreen()),
              ),
              child: Text(tr('viewAll'),
                  style: AuroraText.bodySmall.copyWith(color: AuroraColors.ember)),
            ),
          ],
        ),
        const SizedBox(height: AuroraSpacing.md),
        ..._rides.map((o) => Padding(
              padding: const EdgeInsets.only(bottom: AuroraSpacing.sm),
              child: AuroraCard(
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                      builder: (_) => RideDetailsScreen(order: o)),
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
                      child: Icon(Icons.local_taxi,
                          color: AuroraColors.ember, size: 20),
                    ),
                    const SizedBox(width: AuroraSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(o.destinationAddress,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AuroraText.titleSmall),
                          const SizedBox(height: 2),
                          Text(df.format(o.createdOn),
                              style: AuroraText.caption),
                        ],
                      ),
                    ),
                    Text('${o.costBest.toStringAsFixed(0)} ${o.currency}',
                        style: AuroraText.titleSmall
                            .copyWith(color: AuroraColors.pearl)),
                  ],
                ),
              ),
            )),
        const SizedBox(height: AuroraSpacing.lg),
      ],
    );
  }
}

// ─── شبكة "تصفّح مواضيع المساعدة" ───
class _HelpTopics extends StatelessWidget {
  const _HelpTopics();

  @override
  Widget build(BuildContext context) {
    final topics = <(IconData, String, String)>[
      (Icons.person_outline, tr('topicAccount'), tr('topicAccountBody')),
      (Icons.payments_outlined, tr('topicPayments'), tr('topicPaymentsBody')),
      (Icons.shield_outlined, tr('topicSafety'), tr('topicSafetyBody')),
      (Icons.menu_book_outlined, tr('topicGuides'), tr('topicGuidesBody')),
      (Icons.map_outlined, tr('topicMap'), tr('topicMapBody')),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(tr('browseTopics'), style: AuroraText.titleMedium),
        const SizedBox(height: AuroraSpacing.md),
        Wrap(
          spacing: AuroraSpacing.sm,
          runSpacing: AuroraSpacing.sm,
          children: topics.map((t) {
            return GestureDetector(
              onTap: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => _HelpTopicScreen(
                    icon: t.$1, title: t.$2, body: t.$3),
              )),
              child: Container(
                width: (MediaQuery.of(context).size.width -
                        AuroraSpacing.lg * 2 -
                        AuroraSpacing.sm) /
                    2,
                padding: const EdgeInsets.all(AuroraSpacing.md),
                decoration: BoxDecoration(
                  color: AuroraColors.ash,
                  borderRadius: BorderRadius.circular(AuroraRadius.md),
                  border: Border.all(color: AuroraColors.border),
                ),
                child: Row(
                  children: [
                    Icon(t.$1, color: AuroraColors.ember, size: 20),
                    const SizedBox(width: AuroraSpacing.sm),
                    Expanded(
                      child: Text(t.$2,
                          style: AuroraText.bodyMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                    ),
                    const Icon(Icons.chevron_left,
                        color: AuroraColors.textSecondary, size: 18),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _HelpTopicScreen extends StatelessWidget {
  const _HelpTopicScreen(
      {required this.icon, required this.title, required this.body});
  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return _AuroraPage(
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
          Text(body,
              style: AuroraText.bodyMedium
                  .copyWith(color: AuroraColors.textSecondary, height: 1.6)),
          const SizedBox(height: AuroraSpacing.xl),
          AuroraButton.primary(
            label: tr('contactUs'),
            icon: Icons.support_agent,
            onPressed: () => Navigator.of(context).maybePop(),
          ),
        ],
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
          ? Center(
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
                    child: Icon(Icons.card_giftcard,
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
                            Icon(Icons.copy, color: AuroraColors.pearl),
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
  bool _reserve = false;
  bool _taxis = true;
  bool _commute = false;

  void _open(Widget page) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));

  @override
  Widget build(BuildContext context) {
    return _AuroraPage(
      title: tr('settings'),
      child: ListView(
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        children: [
          // ─── بطاقة معلومات الحساب ───
          _accountCard(),
          const SizedBox(height: AuroraSpacing.lg),

          // ─── العناوين المحفوظة ───
          _sectionLabel(tr('savedLocations')),
          _navRow(Icons.home_outlined, tr('addHome'),
              onTap: () => _open(const AuroraSavedPlacesScreen())),
          _navRow(Icons.work_outline, tr('addWork'),
              onTap: () => _open(const AuroraSavedPlacesScreen())),
          _navRow(Icons.push_pin_outlined, tr('shortcuts'),
              subtitle: tr('shortcutsSub'),
              onTap: () => _open(const AuroraSavedPlacesScreen())),
          const SizedBox(height: AuroraSpacing.lg),

          // ─── التحكّم والخصوصية ───
          _sectionLabel(tr('controlPrivacy')),
          _navRow(Icons.lock_outline, tr('privacy'),
              subtitle: tr('privacySub'),
              onTap: () => _open(_SettingsDetailScreen(
                    title: tr('privacy'),
                    toggles: [
                      (tr('prShareTrip'), tr('prShareTripSub'), true),
                      (tr('prPersonalized'), tr('prPersonalizedSub'), true),
                    ],
                    linkLabel: tr('privacyPolicy'),
                    linkUrl: 'https://hancr.com/ar/legal/privacy',
                  ))),
          _navRow(Icons.accessibility_new_outlined, tr('accessibility'),
              subtitle: tr('accessibilitySub'),
              onTap: () => _open(_SettingsDetailScreen(
                    title: tr('accessibility'),
                    toggles: [
                      (tr('acLargeText'), tr('acLargeTextSub'), false),
                      (tr('acReduceMotion'), tr('acReduceMotionSub'), false),
                    ],
                  ))),
          _navRow(Icons.campaign_outlined, tr('communication'),
              subtitle: tr('communicationSub'),
              onTap: () => _open(_SettingsDetailScreen(
                    title: tr('communication'),
                    toggles: [
                      (tr('cmPush'), tr('cmPushSub'), true),
                      (tr('cmEmail'), tr('cmEmailSub'), true),
                      (tr('cmSms'), tr('cmSmsSub'), false),
                    ],
                  ))),
          _navRow(Icons.light_mode_outlined, tr('appearance'),
              subtitle: tr('appearanceCurrent'),
              onTap: () => _open(const AppearanceScreen())),
          const SizedBox(height: AuroraSpacing.lg),

          // ─── تفضيلات الركوب ───
          _sectionLabel(tr('ridePreferences')),
          _switchRow(tr('reserve'), _reserve, (v) => setState(() => _reserve = v)),
          _switchRow(tr('taxis'), _taxis, (v) => setState(() => _taxis = v)),
          _switchRow(tr('commuteAlerts'), _commute,
              (v) => setState(() => _commute = v)),
          _navRow(Icons.flag_outlined, tr('chooseTeam'),
              subtitle: tr('chooseTeamSub'),
              onTap: () => _open(const ChooseTeamScreen())),
          const SizedBox(height: AuroraSpacing.lg),

          // ─── الإشعارات ───
          _sectionLabel(tr('notifications')),
          _switchRow(tr('rideNotifs'), _notif, (v) => setState(() => _notif = v)),
          _switchRow(tr('promoNotifs'), _promo, (v) => setState(() => _promo = v)),
          const SizedBox(height: AuroraSpacing.lg),

          // ─── اللغة ───
          _sectionLabel(tr('language')),
          Container(
            margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
            decoration: BoxDecoration(
              color: AuroraColors.ash,
              borderRadius: BorderRadius.circular(AuroraRadius.md),
              border: Border.all(color: AuroraColors.border),
            ),
            child: ListTile(
              leading: Icon(Icons.translate, color: AuroraColors.ember),
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

          // ─── حول ───
          _sectionLabel(tr('about')),
          FutureBuilder<String>(
            future: AccountVersion.raw(),
            builder: (context, snap) =>
                _infoRow(tr('version'), snap.data ?? '…'),
          ),
          _infoRow('hancr.com', 'hancr.com'),
          const SizedBox(height: AuroraSpacing.lg),

          // ─── إجراءات الحساب ───
          _navRow(Icons.swap_horiz, tr('switchAccount'),
              onTap: _showAccountSwitcher),
          _navRow(Icons.logout, tr('signOut'),
              danger: true,
              onTap: () =>
                  _confirmLogout(tr('signOut'), tr('signOutConfirm'))),
        ],
      ),
    );
  }

  Widget _accountCard() {
    return BlocBuilder<RiderBloc, RiderState>(
      builder: (context, state) {
        String name = tr('hancrUser');
        String sub = '';
        String? avatar;
        if (state is RiderLoaded) {
          final r = state.rider;
          name = [r.firstName, r.lastName]
              .where((s) => s != null && s.isNotEmpty)
              .join(' ');
          if (name.isEmpty) name = r.phoneNumber;
          sub = r.email ?? r.phoneNumber;
          avatar = r.avatarUrl;
        }
        return AuroraCard(
          onTap: () => _open(const AccountManagementScreen()),
          child: Row(
            children: [
              RiderAvatar(
                  avatarUrl: avatar,
                  initial: name.isNotEmpty ? name[0].toUpperCase() : '?',
                  size: 52,
                  editable: false),
              const SizedBox(width: AuroraSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: AuroraText.titleSmall),
                    const SizedBox(height: 2),
                    Text(sub,
                        style: AuroraText.bodySmall,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              const Icon(Icons.chevron_left,
                  color: AuroraColors.textSecondary, size: 20),
            ],
          ),
        );
      },
    );
  }

  Widget _navRow(IconData icon, String title,
      {String? subtitle, VoidCallback? onTap, bool danger = false}) {
    // مُوحَّد على AuroraListRow المشترك. (للصفوف الخطرة نُخفي الـchevron.)
    return AuroraListRow(
      icon: icon,
      title: title,
      subtitle: subtitle,
      onTap: onTap,
      danger: danger,
      trailing: danger ? const SizedBox.shrink() : null,
    );
  }

  /// مبدّل الحسابات: يعرض الحسابات المحفوظة ويسمح بالتبديل أو إضافة حساب.
  Future<void> _showAccountSwitcher() async {
    final accounts = await StorageService.getAccounts();
    final currentId = await StorageService.getRiderId();
    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: AuroraColors.coal,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AuroraRadius.lg)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: AuroraSpacing.md),
            Text(tr('switchAccount'), style: AuroraText.titleMedium),
            const SizedBox(height: AuroraSpacing.md),
            ...accounts.map((a) {
              final id = a['riderId'] as int?;
              final isCurrent = id == currentId;
              final name = (a['name'] as String?)?.isNotEmpty == true
                  ? a['name'] as String
                  : (a['phone'] as String? ?? '—');
              return ListTile(
                leading: RiderAvatar(
                    avatarUrl: null,
                    initial: name.isNotEmpty ? name[0].toUpperCase() : '?',
                    size: 40,
                    editable: false),
                title: Text(name,
                    style: AuroraText.bodyMedium
                        .copyWith(color: AuroraColors.pearl)),
                subtitle: Text(a['phone'] as String? ?? '',
                    style: AuroraText.caption),
                trailing: isCurrent
                    ? Icon(Icons.check_circle, color: AuroraColors.ember)
                    : IconButton(
                        icon: Icon(Icons.close,
                            color: AuroraColors.textSecondary, size: 18),
                        onPressed: () async {
                          if (id != null) {
                            await StorageService.removeAccount(id);
                          }
                          if (ctx.mounted) Navigator.pop(ctx);
                        },
                      ),
                onTap: isCurrent || id == null
                    ? null
                    : () async {
                        Navigator.pop(ctx);
                        await _switchTo(id);
                      },
              );
            }),
            const Divider(color: AuroraColors.border, height: 1),
            ListTile(
              leading: Icon(Icons.person_add_alt, color: AuroraColors.ember),
              title: Text(tr('addAccount'),
                  style: AuroraText.bodyMedium
                      .copyWith(color: AuroraColors.pearl)),
              onTap: () {
                Navigator.pop(ctx);
                _confirmLogout(tr('addAccount'), tr('addAccountConfirm'));
              },
            ),
            const SizedBox(height: AuroraSpacing.md),
          ],
        ),
      ),
    );
  }

  Future<void> _switchTo(int riderId) async {
    final ok = await StorageService.activateAccount(riderId);
    if (!ok || !mounted) return;
    await GraphQLClientManager.reset();
    if (!mounted) return;
    context.read<RiderBloc>().add(const RiderLoadRequested());
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(tr('accountSwitched')),
      backgroundColor: AuroraColors.success,
    ));
  }

  Future<void> _confirmLogout(String title, String body) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.coal,
        title: Text(title, style: AuroraText.titleMedium),
        content: Text(body, style: AuroraText.bodyMedium),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(tr('cancel'),
                style: TextStyle(color: AuroraColors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(tr('signOut'),
                style: TextStyle(color: AuroraColors.danger)),
          ),
        ],
      ),
    );
    if (ok == true && mounted) {
      context.read<AuthBloc>().add(const AuthLogoutRequested());
    }
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
// شاشة تفاصيل إعداد عامة (نص إعلامي + مفاتيح محلية + رابط اختياري)
// ════════════════════════════════════════════════════════════════
class _SettingsDetailScreen extends StatefulWidget {
  const _SettingsDetailScreen({
    required this.title,
    this.infoText,
    this.toggles = const [],
    this.linkLabel,
    this.linkUrl,
  });
  final String title;
  final String? infoText;
  final List<(String, String, bool)> toggles; // (label, sub, initial)
  final String? linkLabel;
  final String? linkUrl;

  @override
  State<_SettingsDetailScreen> createState() => _SettingsDetailScreenState();
}

class _SettingsDetailScreenState extends State<_SettingsDetailScreen> {
  late final List<bool> _vals =
      widget.toggles.map((t) => t.$3).toList();

  @override
  Widget build(BuildContext context) {
    return _AuroraPage(
      title: widget.title,
      child: ListView(
        padding: const EdgeInsets.all(AuroraSpacing.lg),
        children: [
          if (widget.infoText != null)
            Container(
              padding: const EdgeInsets.all(AuroraSpacing.lg),
              margin: const EdgeInsets.only(bottom: AuroraSpacing.md),
              decoration: BoxDecoration(
                color: AuroraColors.ash,
                borderRadius: BorderRadius.circular(AuroraRadius.md),
                border: Border.all(color: AuroraColors.border),
              ),
              child: Text(widget.infoText!,
                  style: AuroraText.bodyMedium
                      .copyWith(color: AuroraColors.textSecondary, height: 1.5)),
            ),
          ...List.generate(widget.toggles.length, (i) {
            final t = widget.toggles[i];
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
                        Text(t.$1, style: AuroraText.bodyMedium),
                        const SizedBox(height: 2),
                        Text(t.$2, style: AuroraText.caption),
                      ],
                    ),
                  ),
                  Switch(
                    value: _vals[i],
                    onChanged: (v) => setState(() => _vals[i] = v),
                    activeColor: AuroraColors.ember,
                  ),
                ],
              ),
            );
          }),
          if (widget.linkLabel != null && widget.linkUrl != null) ...[
            const SizedBox(height: AuroraSpacing.sm),
            AuroraButton.secondary(
              label: widget.linkLabel!,
              icon: Icons.open_in_new,
              onPressed: () => launchUrl(Uri.parse(widget.linkUrl!),
                  mode: LaunchMode.externalApplication),
            ),
          ],
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
                    Icon(Icons.check_circle, color: AuroraColors.ember),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
