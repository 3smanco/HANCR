import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_event.dart';
import '../../blocs/order/order_state.dart';
import '../../core/models/order_model.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/motion/motion.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraRateDriverScreen — تقييم السائق بنمط Aurora.
///
/// المحتوى:
/// - Hero card: avatar + name + "كيف كانت رحلتك؟"
/// - 5 stars بـ glow عند الاختيار
/// - Tags chips (نظيف، مهذب، آمن...)
/// - Tip amount selector
/// - Comment field
/// - Submit
class AuroraRateDriverScreen extends StatefulWidget {
  const AuroraRateDriverScreen({super.key});

  @override
  State<AuroraRateDriverScreen> createState() => _AuroraRateDriverScreenState();
}

class _AuroraRateDriverScreenState extends State<AuroraRateDriverScreen> {
  int _rating = 5;
  double _tip = 0;
  final _commentCtrl = TextEditingController();
  final Set<String> _tags = {};

  List<String> get _tagOptions => [
        tr('ratePro'),
        tr('rateClean'),
        tr('rateSafe'),
        tr('rateCalm'),
        tr('rateFriendly'),
        tr('rateOnRoute'),
      ];

  /// أسباب التقييم المنخفض (rating ≤ 3) — لالتقاط الملاحظات السلبية.
  List<String> get _negativeTagOptions => [
        tr('rateNegLate'),
        tr('rateNegReckless'),
        tr('rateNegDirty'),
        tr('rateNegRude'),
        tr('rateNegRoute'),
      ];

  static const _tips = [0.0, 2.0, 5.0, 10.0];

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: Stack(
        children: [
          AuroraBackground(
            child: BlocBuilder<OrderBloc, OrderState>(
              builder: (context, state) {
                final order = state is OrderAwaitingReview ? state.order : null;
                if (order == null) {
                  // لا نعلق أبداً: دوران لحظي + مهرب للرئيسية.
                  return SafeArea(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const AuroraLoader(size: 40),
                          const SizedBox(height: AuroraSpacing.lg),
                          TextButton(
                            onPressed: () => context.go('/home'),
                            child: Text(tr('backHome'),
                                style: AuroraText.bodyMedium
                                    .copyWith(color: AuroraColors.ember)),
                          ),
                        ],
                      ),
                    ),
                  );
                }
                return SafeArea(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AuroraSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: AuroraSpacing.md),

                        // N7 — احتفال اكتمال الرحلة
                        const Center(child: SuccessCheck(size: 64)),
                        const SizedBox(height: AuroraSpacing.lg),

                        // ─── Header ───
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(tr('rateTitle'), style: AuroraText.titleLarge),
                            TextButton(
                              onPressed: () => _skip(context, order),
                              child: Text(
                                tr('skip'),
                                style: AuroraText.bodyMedium.copyWith(
                                  color: AuroraColors.textSecondary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: AuroraSpacing.lg),

                        // ─── Trip summary card ───
                        _tripSummaryCard(order),

                        // ─── Itemized fare breakdown ───
                        if (order.costAfterCoupon > 0) ...[
                          const SizedBox(height: AuroraSpacing.md),
                          _fareBreakdown(order),
                        ],

                        const SizedBox(height: AuroraSpacing.lg),

                        // ─── Driver card ───
                        _driverCard(order),

                        const SizedBox(height: AuroraSpacing.xl),

                        // ─── Stars rating ───
                        Text(
                          tr('howWasRide'),
                          style: AuroraText.titleMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AuroraSpacing.lg),
                        _starsRow(),

                        const SizedBox(height: AuroraSpacing.md),
                        Text(
                          _ratingLabel(),
                          style: AuroraText.bodyMedium.copyWith(
                            color: AuroraColors.ember,
                            fontWeight: FontWeight.w700,
                          ),
                          textAlign: TextAlign.center,
                        ),

                        const SizedBox(height: AuroraSpacing.xl),

                        // ─── Tags: إيجابيات (≥4) أو أسباب سلبية (≤3) ───
                        if (_rating >= 4) ...[
                          Text(
                            tr('whatLiked'),
                            style: AuroraText.titleSmall,
                          ),
                          const SizedBox(height: AuroraSpacing.md),
                          Wrap(
                            spacing: AuroraSpacing.sm,
                            runSpacing: AuroraSpacing.sm,
                            children: _tagOptions.map(_tagChip).toList(),
                          ),
                          const SizedBox(height: AuroraSpacing.xl),
                        ] else ...[
                          Text(
                            tr('whatWrong'),
                            style: AuroraText.titleSmall,
                          ),
                          const SizedBox(height: AuroraSpacing.md),
                          Wrap(
                            spacing: AuroraSpacing.sm,
                            runSpacing: AuroraSpacing.sm,
                            children: _negativeTagOptions.map(_tagChip).toList(),
                          ),
                          const SizedBox(height: AuroraSpacing.xl),
                        ],

                        // ─── Tip ───
                        if (_rating >= 4) ...[
                          Text(
                            tr('tipDriver'),
                            style: AuroraText.titleSmall,
                          ),
                          const SizedBox(height: AuroraSpacing.md),
                          Row(
                            children: _tips.map(_tipChip).toList(),
                          ),
                          const SizedBox(height: AuroraSpacing.xl),
                        ],

                        // ─── Comment ───
                        Text(tr('extraComment'), style: AuroraText.titleSmall),
                        const SizedBox(height: AuroraSpacing.md),
                        TextField(
                          controller: _commentCtrl,
                          maxLines: 3,
                          style: AuroraText.bodyMedium.copyWith(
                            color: AuroraColors.pearl,
                          ),
                          decoration: InputDecoration(
                            hintText: tr('shareExperience'),
                          ),
                        ),

                        const SizedBox(height: AuroraSpacing.xl),

                        // ─── Submit ───
                        AuroraButton.primary(
                          label: _tip > 0
                              ? '${tr('sendRating')} (+${_tip.toStringAsFixed(0)} ${order.currency})'
                              : tr('sendRating'),
                          icon: Icons.send_rounded,
                          loading: state is OrderLoading,
                          onPressed: () => _submit(context, order),
                        ),

                        const SizedBox(height: AuroraSpacing.md),

                        // ─── إعادة حجز نفس الرحلة (D3) ───
                        AuroraButton.secondary(
                          label: tr('rebookRoute'),
                          icon: Icons.replay_rounded,
                          onPressed: () => _rebook(context, order),
                        ),

                        const SizedBox(height: AuroraSpacing.huge),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          // احتفال إتمام الرحلة (يُشغَّل مرة عند الدخول)
          const Positioned.fill(child: ConfettiBurst(play: true)),
        ],
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  Widget _tripSummaryCard(OrderModel order) {
    final fmt = NumberFormat('#,##0.00', 'ar');
    return Container(
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
              Icon(Icons.check_circle_outline,
                  color: AuroraColors.pearl, size: 20),
              const SizedBox(width: AuroraSpacing.sm),
              Text(
                tr('rideCompleted'),
                style: AuroraText.bodyMedium.copyWith(
                  color: AuroraColors.pearl.withValues(alpha: 0.9),
                ),
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.sm),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                fmt.format(order.paidAmount),
                style: AuroraText.displayMedium.copyWith(
                  color: AuroraColors.pearl,
                  height: 1,
                ),
              ),
              const SizedBox(width: 6),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  order.currency,
                  style:
                      AuroraText.titleSmall.copyWith(color: AuroraColors.pearl),
                ),
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.md),
          Row(
            children: [
              _statPill(
                icon: Icons.straighten,
                label: order.distanceLabel,
              ),
              const SizedBox(width: AuroraSpacing.sm),
              _statPill(
                icon: Icons.schedule,
                label: order.durationLabel,
              ),
              if (order.milesEarned > 0) ...[
                const SizedBox(width: AuroraSpacing.sm),
                _statPill(
                  icon: Icons.workspace_premium_rounded,
                  label: '+${order.milesEarned} ${tr('milesEarnedShort')}',
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  /// تفصيل الأجرة: أجرة الرحلة + وقت الانتظار (إن وُجد) → الإجمالي.
  Widget _fareBreakdown(OrderModel order) {
    final fmt = NumberFormat('#,##0.00', 'ar');
    final total = order.costAfterCoupon;
    final wait = order.waitCost;
    final base = (total - wait) < 0 ? 0.0 : (total - wait);

    Widget line(String label, double value, {bool strong = false}) {
      final style = (strong ? AuroraText.titleSmall : AuroraText.bodyMedium)
          .copyWith(
        color: strong ? AuroraColors.pearl : AuroraColors.textPrimary,
        fontWeight: strong ? FontWeight.w800 : FontWeight.w600,
      );
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          children: [
            Expanded(child: Text(label, style: style)),
            Text('${fmt.format(value)} ${order.currency}', style: style),
          ],
        ),
      );
    }

    return AuroraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(Icons.receipt_long_rounded,
                  size: 18, color: AuroraColors.ember),
              const SizedBox(width: AuroraSpacing.sm),
              Text(tr('fareBreakdown'), style: AuroraText.titleSmall),
            ],
          ),
          const SizedBox(height: AuroraSpacing.sm),
          line(tr('baseFare'), base.toDouble()),
          if (wait > 0) line(tr('waitTimeFee'), wait),
          Divider(color: AuroraColors.divider, height: AuroraSpacing.lg),
          line(tr('total'), total, strong: true),
        ],
      ),
    );
  }

  Widget _statPill({required IconData icon, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AuroraColors.pearl.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(AuroraRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AuroraColors.pearl, size: 14),
          const SizedBox(width: 4),
          Text(
            label,
            style: AuroraText.caption.copyWith(
              color: AuroraColors.pearl,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _driverCard(OrderModel order) {
    final name = order.driverName ?? tr('driver');
    return AuroraCard(
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              gradient: AuroraColors.emberGradient,
              shape: BoxShape.circle,
              boxShadow: AuroraShadows.iconGlow,
            ),
            child: Center(
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style:
                    AuroraText.titleLarge.copyWith(color: AuroraColors.pearl),
              ),
            ),
          ),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: AuroraText.titleSmall),
                if (order.carBrand != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    '${order.carBrand} ${order.carModel ?? ''}'.trim(),
                    style: AuroraText.bodySmall,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _starsRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (i) {
        final idx = i + 1;
        final filled = idx <= _rating;
        return GestureDetector(
          // تغيير التقييم يمسح الوسوم (إيجابية/سلبية حسب السياق).
          onTap: () => setState(() {
            _rating = idx;
            _tags.clear();
          }),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            margin: const EdgeInsets.symmetric(horizontal: 6),
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: filled
                  ? [
                      BoxShadow(
                        color: AuroraColors.gold,
                        blurRadius: 16,
                        spreadRadius: -2,
                      ),
                    ]
                  : null,
            ),
            child: Icon(
              filled ? Icons.star_rounded : Icons.star_outline_rounded,
              color: filled ? AuroraColors.gold : AuroraColors.textHint,
              size: 44,
            ),
          ),
        );
      }),
    );
  }

  String _ratingLabel() {
    switch (_rating) {
      case 5:
        return tr('star5');
      case 4:
        return tr('star4');
      case 3:
        return tr('star3');
      case 2:
        return tr('star2');
      case 1:
        return tr('star1');
      default:
        return '';
    }
  }

  Widget _tagChip(String tag) {
    final selected = _tags.contains(tag);
    return GestureDetector(
      onTap: () => setState(() {
        if (selected) {
          _tags.remove(tag);
        } else {
          _tags.add(tag);
        }
      }),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(
            horizontal: AuroraSpacing.md, vertical: AuroraSpacing.sm),
        decoration: BoxDecoration(
          color: selected ? AuroraColors.ember : AuroraColors.ash,
          borderRadius: BorderRadius.circular(AuroraRadius.pill),
          border: Border.all(
            color: selected ? AuroraColors.ember : AuroraColors.border,
          ),
          boxShadow: selected ? AuroraShadows.iconGlow : null,
        ),
        child: Text(
          tag,
          style: AuroraText.bodySmall.copyWith(
            color: AuroraColors.pearl,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _tipChip(double amount) {
    final selected = _tip == amount;
    final label = amount == 0 ? tr('none') : amount.toStringAsFixed(0);
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.only(left: AuroraSpacing.sm),
        child: GestureDetector(
          onTap: () => setState(() => _tip = amount),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(vertical: AuroraSpacing.md),
            decoration: BoxDecoration(
              color: selected ? AuroraColors.ember : AuroraColors.ash,
              borderRadius: BorderRadius.circular(AuroraRadius.md),
              border: Border.all(
                color: selected ? AuroraColors.ember : AuroraColors.border,
              ),
              boxShadow: selected ? AuroraShadows.iconGlow : null,
            ),
            child: Center(
              child: Text(
                label,
                style: AuroraText.titleSmall.copyWith(
                  color: AuroraColors.pearl,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _submit(BuildContext context, OrderModel order) {
    context.read<OrderBloc>().add(
          OrderRateDriverRequested(
            orderId: order.id,
            rating: _rating.toDouble(),
            comment: _buildComment(),
            tip: _tip > 0 ? _tip : null,
          ),
        );
  }

  String? _buildComment() {
    final tagPart = _tags.isEmpty ? '' : _tags.join('، ');
    final textPart = _commentCtrl.text.trim();
    final combined = [tagPart, textPart].where((s) => s.isNotEmpty).join('. ');
    return combined.isEmpty ? null : combined;
  }

  /// إعادة حجز نفس الرحلة: ينتقل للحجز بنفس الوجهة ثم يُرسل التقييم الحالي.
  void _rebook(BuildContext context, OrderModel order) {
    final dest = order.points.isNotEmpty ? order.points.last : null;
    final bloc = context.read<OrderBloc>();
    context.go('/book', extra: {
      'destination': dest,
      'label': order.destinationAddress,
    });
    bloc.add(OrderRateDriverRequested(
      orderId: order.id,
      rating: _rating.toDouble(),
      comment: _buildComment(),
      tip: _tip > 0 ? _tip : null,
    ));
  }

  void _skip(BuildContext context, OrderModel order) {
    context.read<OrderBloc>().add(
          OrderRateDriverRequested(
            orderId: order.id,
            rating: 0,
            comment: null,
            tip: null,
          ),
        );
  }
}
