import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_state.dart';
import '../i18n/app_localization.dart';
import '../models/order_model.dart';
import '../motion/motion.dart';
import '../theme/aurora_theme.dart';

/// ╔══════════════════════════════════════════════════════════════╗
/// ║  N9 — LiveActivityBar                                         ║
/// ║  شريط "نشاط حي" يظهر أعلى الرئيسية أثناء وجود رحلة فعّالة:      ║
/// ║  نقطة نابضة + حالة الرحلة + اسم السائق، وبالنقر يفتح التتبّع.   ║
/// ║  يختفي تماماً حين لا توجد رحلة.                                 ║
/// ╚══════════════════════════════════════════════════════════════╝
class LiveActivityBar extends StatelessWidget {
  const LiveActivityBar({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<OrderBloc, OrderState>(
      builder: (ctx, state) {
        OrderModel? order;
        if (state is OrderActive) {
          order = state.order;
        } else if (state is OrderCreated) {
          order = state.order;
        }
        if (order == null) return const SizedBox.shrink();
        final o = order;

        return Padding(
          padding: const EdgeInsets.only(bottom: AuroraSpacing.md),
          child: Pressable(
            onTap: () => ctx.go('/tracking'),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AuroraSpacing.md,
                vertical: AuroraSpacing.sm + 2,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AuroraColors.ember.withValues(alpha: 0.18),
                    AuroraColors.ash,
                  ],
                ),
                borderRadius: BorderRadius.circular(AuroraRadius.lg),
                border: Border.all(color: AuroraColors.borderGlow),
              ),
              child: Row(
                children: [
                  PulseRing(
                    color: AuroraColors.ember,
                    size: 10,
                    maxScale: 2.4,
                  ),
                  const SizedBox(width: AuroraSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _statusLabel(o),
                          style: AuroraText.titleSmall
                              .copyWith(color: AuroraColors.pearl),
                        ),
                        Text(
                          o.driverName ?? o.destinationAddress,
                          style: AuroraText.bodySmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_left,
                      color: AuroraColors.textSecondary),
                ],
              ),
            ),
          ).fadeSlideIn(),
        );
      },
    );
  }

  String _statusLabel(OrderModel o) {
    switch (o.status) {
      case OrderStatus.driverAccepted:
        return tr('driverOnWay');
      case OrderStatus.arrived:
        return tr('driverArrived');
      case OrderStatus.started:
        return tr('inProgress');
      default:
        return o.status.label;
    }
  }
}
