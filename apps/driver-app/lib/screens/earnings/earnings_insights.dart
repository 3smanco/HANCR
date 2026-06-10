import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:intl/intl.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/driver_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/motion/motion.dart';
import '../../core/services/storage_service.dart';
import '../../core/theme/aurora_theme.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N10 — EarningsInsights                                       ║
/// ║  بطاقة الهدف اليومي (تقدّم متحرك + تعديل) + رسم أرباح 7 أيام    ║
/// ║  (أعمدة تنمو بأنيميشن). يقرأ myDailyEarnings من driver-api.    ║
/// ╚══════════════════════════════════════════════════════════════╝
class EarningsInsights extends StatefulWidget {
  const EarningsInsights({super.key, required this.currency});

  final String currency;

  @override
  State<EarningsInsights> createState() => _EarningsInsightsState();
}

class _DayEarning {
  _DayEarning(this.date, this.amount);
  final String date;
  final double amount;
}

class _EarningsInsightsState extends State<EarningsInsights>
    with SingleTickerProviderStateMixin {
  List<_DayEarning> _days = [];
  double _goal = 300;
  bool _loading = true;

  late final AnimationController _anim =
      AnimationController(vsync: this, duration: Motion.slow)
        ..addListener(() => setState(() {}));

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final goal = await StorageService.getDailyGoal();
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(myDailyEarningsQuery),
        variables: const {'days': 7},
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final list = ((res.data?['myDailyEarnings'] as List<dynamic>?) ?? [])
          .map((e) => _DayEarning(
                (e as Map<String, dynamic>)['date'] as String,
                (e['amount'] as num).toDouble(),
              ))
          .toList();
      if (!mounted) return;
      setState(() {
        _days = list;
        _goal = goal ?? 300;
        _loading = false;
      });
      _anim.forward(from: 0);
    } catch (_) {
      if (mounted) {
        setState(() {
          _goal = goal ?? 300;
          _loading = false;
        });
      }
    }
  }

  double get _today => _days.isNotEmpty ? _days.last.amount : 0;

  Future<void> _editGoal() async {
    final ctrl = TextEditingController(text: _goal.toStringAsFixed(0));
    final v = await showDialog<double>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AuroraColors.ash,
        title: Text(tr('dailyGoal'), style: AuroraText.titleSmall),
        content: TextField(
          controller: ctrl,
          keyboardType: TextInputType.number,
          autofocus: true,
          decoration: InputDecoration(suffixText: widget.currency),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(tr('cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, double.tryParse(ctrl.text)),
            child: Text(tr('save')),
          ),
        ],
      ),
    );
    if (v != null && v > 0) {
      await StorageService.saveDailyGoal(v);
      if (mounted) setState(() => _goal = v);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return SizedBox(
        height: 160,
        child: Center(
          child: CircularProgressIndicator(color: AuroraColors.ember),
        ),
      );
    }
    final reached = _goal > 0 ? (_today / _goal).clamp(0.0, 1.0) : 0.0;
    final animated = reached * _anim.value;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _goalCard(animated, reached),
        const SizedBox(height: AuroraSpacing.md),
        _chartCard(),
      ],
    );
  }

  Widget _goalCard(double animated, double reached) {
    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.flag_rounded, color: AuroraColors.ember, size: 18),
              const SizedBox(width: AuroraSpacing.sm),
              Text(tr('dailyGoal'), style: AuroraText.titleSmall),
              const Spacer(),
              GestureDetector(
                onTap: _editGoal,
                child: Icon(Icons.edit_outlined,
                    color: AuroraColors.textSecondary, size: 18),
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.md),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text('${_today.toStringAsFixed(0)} ',
                  style: AuroraText.displayMedium
                      .copyWith(color: AuroraColors.ember)),
              Text('/ ${_goal.toStringAsFixed(0)} ${widget.currency}',
                  style: AuroraText.bodyMedium),
            ],
          ),
          const SizedBox(height: AuroraSpacing.sm),
          ClipRRect(
            borderRadius: BorderRadius.circular(AuroraRadius.pill),
            child: LinearProgressIndicator(
              value: animated,
              minHeight: 10,
              backgroundColor: AuroraColors.coal,
              valueColor: AlwaysStoppedAnimation(
                reached >= 1 ? AuroraColors.success : AuroraColors.ember,
              ),
            ),
          ),
          const SizedBox(height: AuroraSpacing.sm),
          Text(
            reached >= 1
                ? tr('goalReached')
                : '${(reached * 100).toStringAsFixed(0)}%',
            style: AuroraText.caption.copyWith(
              color: reached >= 1 ? AuroraColors.success : AuroraColors.textHint,
            ),
          ),
        ],
      ),
    );
  }

  Widget _chartCard() {
    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(tr('last7Days'), style: AuroraText.titleSmall),
          const SizedBox(height: AuroraSpacing.lg),
          SizedBox(
            height: 120,
            child: CustomPaint(
              size: Size.infinite,
              painter: _BarsPainter(
                _days,
                _anim.value,
                bar: AuroraColors.emberMute,
                today: AuroraColors.ember,
              ),
            ),
          ),
          const SizedBox(height: AuroraSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: _days.map((d) {
              final wd = DateFormat('E', 'ar').format(DateTime.parse(d.date));
              return Expanded(
                child: Text(wd,
                    textAlign: TextAlign.center, style: AuroraText.caption),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _BarsPainter extends CustomPainter {
  _BarsPainter(this.days, this.t, {required this.bar, required this.today});

  final List<_DayEarning> days;
  final double t;
  final Color bar;
  final Color today;

  @override
  void paint(Canvas canvas, Size size) {
    if (days.isEmpty) return;
    final maxAmount =
        days.map((d) => d.amount).fold<double>(1, (a, b) => b > a ? b : a);
    const gap = 10.0;
    final n = days.length;
    final bw = (size.width - gap * (n - 1)) / n;
    for (var i = 0; i < n; i++) {
      final h = (days[i].amount / maxAmount) * size.height * t;
      final x = i * (bw + gap);
      final rect = RRect.fromRectAndCorners(
        Rect.fromLTWH(x, size.height - h, bw, h),
        topLeft: const Radius.circular(5),
        topRight: const Radius.circular(5),
      );
      canvas.drawRRect(
        rect,
        Paint()..color = i == n - 1 ? today : bar,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _BarsPainter old) =>
      old.t != t || old.days != days;
}
