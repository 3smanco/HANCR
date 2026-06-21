import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../blocs/order/order_bloc.dart';
import '../../../blocs/order/order_event.dart';
import '../../../blocs/auth/auth_bloc.dart';
import '../../../blocs/auth/auth_state.dart';
import '../../../blocs/order/order_state.dart';
import '../../../core/i18n/app_localization.dart';
import '../../../core/models/order_model.dart';
import '../../../core/widgets/aurora/aurora.dart';
import '../../../core/motion/motion.dart';

/// لوحة الطلب الوارد — أُعيد بناؤها بهوية Aurora (كانت Material أبيض).
/// حلقة عدّ نابضة + دخول bounce + وسوم متدرّجة + زر قبول متوهّج.
class IncomingOrderSheet extends StatefulWidget {
  final DriverOrderModel order;
  const IncomingOrderSheet({super.key, required this.order});
  @override
  State<IncomingOrderSheet> createState() => _IncomingOrderSheetState();
}

class _IncomingOrderSheetState extends State<IncomingOrderSheet> {
  static const int _total = 25;
  int _countdown = _total;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    Haptics.warning(); // تنبيه لمسي عند ورود الطلب
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_countdown > 0) {
        setState(() => _countdown--);
      } else {
        _decline();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _accept() {
    _timer?.cancel();
    Haptics.success();
    context.read<OrderBloc>().add(OrderAcceptRequested(widget.order.id));
    Navigator.pop(context);
  }

  void _decline() {
    _timer?.cancel();
    context.read<OrderBloc>().add(const OrderDeclineRequested());
    if (mounted) Navigator.pop(context);
  }

  Color get _ringColor =>
      _countdown > 10 ? AuroraColors.success : AuroraColors.danger;

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    return BlocListener<OrderBloc, OrderState>(
      listener: (ctx, state) {
        if (state is OrderActive) Navigator.of(ctx).popUntil((r) => r.isFirst);
        if (state is OrderError) Navigator.pop(ctx);
      },
      child: Container(
        padding: EdgeInsets.fromLTRB(
          20, 12, 20, 20 + MediaQuery.of(context).padding.bottom,
        ),
        decoration: BoxDecoration(
          color: AuroraColors.coal,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: const Border(top: BorderSide(color: AuroraColors.borderGlow)),
          boxShadow: const [
            BoxShadow(color: Color(0x99000000), blurRadius: 30, offset: Offset(0, -10)),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // مقبض
            Container(
              width: 44,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: AuroraColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // حلقة العدّ النابضة
            GlowPulse(
              color: _ringColor,
              minBlur: 6,
              maxBlur: 22,
              child: SizedBox(
                width: 76,
                height: 76,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 76,
                      height: 76,
                      child: TweenAnimationBuilder<double>(
                        tween: Tween<double>(
                            begin: _countdown / _total,
                            end: _countdown / _total),
                        duration: const Duration(milliseconds: 900),
                        builder: (context, v, _) => CircularProgressIndicator(
                          value: v,
                          strokeWidth: 5,
                          backgroundColor: AuroraColors.smoke,
                          valueColor: AlwaysStoppedAnimation<Color>(_ringColor),
                        ),
                      ),
                    ),
                    Text('$_countdown',
                        style: AuroraText.titleLarge
                            .copyWith(color: AuroraColors.pearl)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            Text(tr('newRideRequest'),
                style: AuroraText.titleMedium, textAlign: TextAlign.center),
            const SizedBox(height: 14),

            // وسوم الخدمات الخاصة (متدرّجة)
            _ServiceTagsRow(order: o),

            // المسار
            _TripRow(origin: o.originAddress, destination: o.destinationAddress),
            const SizedBox(height: 12),

            // إحصاءات
            Row(
              children: [
                Expanded(
                    child: _InfoChip(
                            icon: Icons.route, label: o.distanceLabel)
                        .popIn(index: 0)),
                const SizedBox(width: 10),
                Expanded(
                    child: _InfoChip(
                            icon: Icons.access_time, label: o.durationLabel)
                        .popIn(index: 1)),
                const SizedBox(width: 10),
                Expanded(
                    child: _InfoChip(
                      icon: Icons.payments_outlined,
                      label:
                          '${o.costAfterCoupon.toStringAsFixed(0)} ${o.currency}',
                      bold: true,
                      color: AuroraColors.ember,
                    ).popIn(index: 2)),
              ],
            ),

            if (o.quietRide || o.audioOff) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  if (o.quietRide)
                    _MoodChip(icon: Icons.do_not_disturb, label: tr('quietRide')),
                  if (o.audioOff)
                    _MoodChip(icon: Icons.music_off, label: tr('audioOff')),
                ],
              ),
            ],

            // الراكب
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.star, color: AuroraColors.gold, size: 16),
                const SizedBox(width: 4),
                Text(o.riderRating.toStringAsFixed(1),
                    style: AuroraText.titleSmall),
                const SizedBox(width: 6),
                if (o.riderName != null)
                  Flexible(
                    child: Text(o.riderName!,
                        overflow: TextOverflow.ellipsis,
                        style: AuroraText.bodyMedium),
                  ),
                const Spacer(),
                Text(
                  o.paymentMode.toUpperCase(),
                  style: AuroraText.bodySmall.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AuroraColors.info,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // الأزرار
            Row(
              children: [
                Expanded(
                  child: AuroraButton.danger(
                    label: tr('decline'),
                    onPressed: _decline,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  flex: 2,
                  child: GlowPulse(
                    color: AuroraColors.success,
                    minBlur: 4,
                    maxBlur: 20,
                    child: AuroraButton.primary(
                      label: tr('accept'),
                      icon: Icons.check_circle,
                      onPressed: _accept,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ).animate().slideY(
            begin: 0.12,
            end: 0,
            duration: Motion.sheet,
            curve: Motion.overshoot,
          ).fadeIn(duration: Motion.base),
    );
  }
}

class _TripRow extends StatelessWidget {
  final String origin;
  final String destination;
  const _TripRow({required this.origin, required this.destination});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Column(
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: AuroraColors.success,
                shape: BoxShape.circle,
              ),
            ),
            Container(width: 2, height: 30, color: AuroraColors.border),
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: AuroraColors.ember,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(origin,
                  style: AuroraText.bodyMedium
                      .copyWith(color: AuroraColors.textSecondary),
                  overflow: TextOverflow.ellipsis),
              const SizedBox(height: 16),
              Text(destination,
                  style: AuroraText.titleSmall, overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ],
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool bold;
  final Color? color;
  const _InfoChip({
    required this.icon,
    required this.label,
    this.bold = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Column(
        children: [
          Icon(icon, size: 18, color: color ?? AuroraColors.textSecondary),
          const SizedBox(height: 4),
          Text(
            label,
            style: AuroraText.bodySmall.copyWith(
              fontWeight: bold ? FontWeight.w800 : FontWeight.w400,
              color: color ?? AuroraColors.pearl,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

/// صفّ شارات الخدمات الخاصة (VIP/Night/Family/Hourly/Grocery/Prepaid).
class _ServiceTagsRow extends StatelessWidget {
  final DriverOrderModel order;
  const _ServiceTagsRow({required this.order});

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthBloc>().state;
    final currentDriverId = auth is AuthAuthenticated ? auth.driverId : null;

    final tags = <Widget>[];

    if (order.preferredDriverId != null &&
        order.preferredDriverId == currentDriverId) {
      tags.add(_ServiceTag(
          icon: Icons.workspace_premium,
          label: tr('tag_vip'),
          color: AuroraColors.gold));
    }
    if (order.nightShift) {
      tags.add(_ServiceTag(
          icon: Icons.nightlight_round,
          label: tr('tag_night'),
          color: const Color(0xFF6366F1)));
    }
    if (order.familyMode || order.preferFemaleDriver) {
      tags.add(_ServiceTag(
          icon: Icons.family_restroom,
          label: tr('tag_family'),
          color: const Color(0xFFEC4899)));
    }
    if (order.isHourly) {
      tags.add(_ServiceTag(
          icon: Icons.av_timer,
          label: '${tr('tag_hourly')} · ${order.bookedHours}h',
          color: AuroraColors.ember));
    }
    if (order.isGrocery) {
      tags.add(_ServiceTag(
          icon: Icons.shopping_basket,
          label:
              '${tr('tag_grocery')} · ${order.budget?.toStringAsFixed(0) ?? '—'} ${order.currency}',
          color: AuroraColors.success));
    }
    if (order.entitlementId != null) {
      tags.add(_ServiceTag(
          icon: Icons.confirmation_number_outlined,
          label: tr('tag_paid_bundle'),
          color: const Color(0xFF8B5CF6)));
    }
    if (order.companyId != null) {
      tags.add(_ServiceTag(
          icon: Icons.business_outlined,
          label: tr('tag_paid_company'),
          color: AuroraColors.textSecondary));
    }

    if (tags.isEmpty) return const SizedBox(height: 4);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 4),
      child: Wrap(
        spacing: 6,
        runSpacing: 6,
        alignment: WrapAlignment.center,
        children: [
          for (var i = 0; i < tags.length; i++) tags[i].popIn(index: i),
        ],
      ),
    );
  }
}

class _ServiceTag extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _ServiceTag({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: color,
              )),
        ],
      ),
    );
  }
}

class _MoodChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _MoodChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AuroraColors.ember.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AuroraColors.ember.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AuroraColors.ember),
          const SizedBox(width: 4),
          Text(label,
              style: AuroraText.caption.copyWith(color: AuroraColors.ember)),
        ],
      ),
    );
  }
}
