import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/services/storage_service.dart';
import '../../core/widgets/aurora/aurora.dart';

/// بلد/فريق — علم مبسّط مرسوم داخل الودجت (أشرطة ملوّنة، لا أصول).
class _Team {
  final String code;
  final String name;
  final List<Color> bands;
  final Axis axis; // اتجاه الأشرطة
  final Color? dot; // نقطة مركزية اختيارية (اليابان/الهند…)
  const _Team(this.code, this.name, this.bands, this.axis, {this.dot});
  Color get primary => bands.first;
}

const _continents = <String, List<_Team>>{
  'teamMena': [
    _Team(
        'SA', 'teamSA', [Color(0xFF165D31), Color(0xFF165D31)], Axis.vertical),
    _Team('QA', 'teamQA', [Color(0xFF8A1538), Color(0xFFFFFFFF)],
        Axis.horizontal),
    _Team(
        'AE',
        'teamAE',
        [Color(0xFF00843D), Color(0xFFFFFFFF), Color(0xFF000000)],
        Axis.vertical),
    _Team(
        'EG',
        'teamEG',
        [Color(0xFFCE1126), Color(0xFFFFFFFF), Color(0xFF000000)],
        Axis.vertical),
  ],
  'teamEurope': [
    _Team(
        'FR',
        'teamFR',
        [Color(0xFF0055A4), Color(0xFFFFFFFF), Color(0xFFEF4135)],
        Axis.horizontal),
    _Team(
        'DE',
        'teamDE',
        [Color(0xFF000000), Color(0xFFDD0000), Color(0xFFFFCE00)],
        Axis.vertical),
    _Team(
        'IT',
        'teamIT',
        [Color(0xFF008C45), Color(0xFFFFFFFF), Color(0xFFCD212A)],
        Axis.horizontal),
    _Team(
        'ES',
        'teamES',
        [Color(0xFFAA151B), Color(0xFFF1BF00), Color(0xFFAA151B)],
        Axis.vertical),
    _Team(
        'NL',
        'teamNL',
        [Color(0xFFAE1C28), Color(0xFFFFFFFF), Color(0xFF21468B)],
        Axis.vertical),
    _Team('PT', 'teamPT', [Color(0xFF006600), Color(0xFFFF0000)],
        Axis.horizontal),
  ],
  'teamAmericas': [
    _Team(
        'US',
        'teamUS',
        [Color(0xFFB22234), Color(0xFFFFFFFF), Color(0xFF3C3B6E)],
        Axis.vertical),
    _Team('BR', 'teamBR', [Color(0xFF009C3B), Color(0xFFFFDF00)], Axis.vertical,
        dot: Color(0xFF002776)),
    _Team(
        'AR',
        'teamAR',
        [Color(0xFF74ACDF), Color(0xFFFFFFFF), Color(0xFF74ACDF)],
        Axis.vertical),
  ],
  'teamAsia': [
    _Team('JP', 'teamJP', [Color(0xFFFFFFFF), Color(0xFFFFFFFF)], Axis.vertical,
        dot: Color(0xFFBC002D)),
    _Team(
        'IN',
        'teamIN',
        [Color(0xFFFF9933), Color(0xFFFFFFFF), Color(0xFF138808)],
        Axis.vertical,
        dot: Color(0xFF000080)),
    _Team('TR', 'teamTR', [Color(0xFFE30A17), Color(0xFFE30A17)], Axis.vertical,
        dot: Color(0xFFFFFFFF)),
  ],
  'teamOceania': [
    _Team(
        'AU', 'teamAU', [Color(0xFF00247D), Color(0xFF00247D)], Axis.vertical),
    _Team(
        'NZ', 'teamNZ', [Color(0xFF00247D), Color(0xFF00247D)], Axis.vertical),
  ],
};

class ChooseTeamScreen extends StatefulWidget {
  const ChooseTeamScreen({super.key});
  @override
  State<ChooseTeamScreen> createState() => _ChooseTeamScreenState();
}

class _ChooseTeamScreenState extends State<ChooseTeamScreen> {
  String? _selected;

  @override
  void initState() {
    super.initState();
    StorageService.getTeam().then((v) {
      if (mounted) setState(() => _selected = v);
    });
  }

  _Team? get _selectedTeam {
    for (final list in _continents.values) {
      for (final t in list) {
        if (t.code == _selected) return t;
      }
    }
    return null;
  }

  Future<void> _apply() async {
    if (_selected == null) return;
    await StorageService.saveTeam(_selected!);
    // مزامنة مع الخادم (تجميلي — لا يحجب عند الفشل)
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(MutationOptions(
        document: gql(updateProfileMutation),
        variables: {
          'input': {'teamCode': _selected}
        },
      ));
    } catch (_) {
      // يبقى محفوظاً محلياً؛ يُعاد المحاولة عند الفتح التالي
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(
        children: [
          Icon(Icons.check_circle, color: AuroraColors.pearl, size: 20),
          const SizedBox(width: AuroraSpacing.sm),
          Expanded(child: Text(tr('teamApplied'))),
        ],
      ),
      backgroundColor: AuroraColors.smoke,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final tint = _selectedTeam?.primary;
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close, color: AuroraColors.pearl),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text(tr('chooseTeam'), style: AuroraText.titleMedium),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              // هيرو السيارة (يُلوَّن بلون الفريق المختار)
              Container(
                height: 140,
                margin: const EdgeInsets.all(AuroraSpacing.lg),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AuroraRadius.lg),
                  gradient: LinearGradient(
                    colors: [
                      (tint ?? AuroraColors.ember).withValues(alpha: 0.35),
                      AuroraColors.coal,
                    ],
                  ),
                ),
                child: Image.asset('assets/images/team-car.png',
                    fit: BoxFit.contain),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(
                      AuroraSpacing.lg, 0, AuroraSpacing.lg, AuroraSpacing.md),
                  children: [
                    for (final entry in _continents.entries) ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(
                            vertical: AuroraSpacing.sm),
                        child:
                            Text(tr(entry.key), style: AuroraText.titleSmall),
                      ),
                      GridView.count(
                        crossAxisCount: 4,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: AuroraSpacing.md,
                        crossAxisSpacing: AuroraSpacing.sm,
                        childAspectRatio: 0.78,
                        children: entry.value.map(_tile).toList(),
                      ),
                    ],
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AuroraSpacing.lg),
                child: AuroraButton.primary(
                  label: tr('apply'),
                  onPressed: _selected == null ? null : _apply,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _tile(_Team t) {
    final sel = _selected == t.code;
    return GestureDetector(
      onTap: () => setState(() => _selected = t.code),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AuroraRadius.sm + 3),
              border: Border.all(
                color: sel ? AuroraColors.ember : Colors.transparent,
                width: 2.5,
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(AuroraRadius.sm),
              child: SizedBox(
                width: 56,
                height: 40,
                child: _flag(t),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(tr(t.name),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AuroraText.caption.copyWith(color: AuroraColors.pearl)),
        ],
      ),
    );
  }

  Widget _flag(_Team t) {
    final bands = Flex(
      direction: t.axis,
      children:
          t.bands.map((c) => Expanded(child: Container(color: c))).toList(),
    );
    if (t.dot == null) return bands;
    return Stack(
      alignment: Alignment.center,
      children: [
        bands,
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(color: t.dot, shape: BoxShape.circle),
        ),
      ],
    );
  }
}
