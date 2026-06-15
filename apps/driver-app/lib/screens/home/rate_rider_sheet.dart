import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/order_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/motion/motion.dart';
import '../../core/widgets/aurora/aurora.dart';

/// RateRiderSheet — ورقة تقييم الراكب بعد الرحلة (1..5 نجوم).
class RateRiderSheet extends StatefulWidget {
  const RateRiderSheet({
    super.key,
    required this.orderId,
    required this.riderName,
  });

  final int orderId;
  final String riderName;

  /// يعرض الورقة (لا يُغلق إلا بالتقييم أو التخطّي).
  static Future<void> show(
    BuildContext context, {
    required int orderId,
    required String riderName,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: AuroraColors.coal,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AuroraRadius.xl)),
      ),
      builder: (_) => RateRiderSheet(orderId: orderId, riderName: riderName),
    );
  }

  @override
  State<RateRiderSheet> createState() => _RateRiderSheetState();
}

class _RateRiderSheetState extends State<RateRiderSheet> {
  int _stars = 0;
  bool _busy = false;

  Future<void> _submit() async {
    if (_stars == 0) return;
    setState(() => _busy = true);
    try {
      final client = await GraphQLClientManager.get();
      await client.mutate(MutationOptions(
        document: gql(rateRiderMutation),
        variables: {'orderId': widget.orderId, 'stars': _stars},
      ));
      Haptics.success();
    } catch (_) {
      // التقييم تحسين — لا نُعطّل التدفّق عند الفشل.
    }
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AuroraSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AuroraColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: AuroraSpacing.xl),
            Icon(Icons.emoji_emotions_outlined,
                size: 48, color: AuroraColors.ember),
            const SizedBox(height: AuroraSpacing.md),
            Text(tr('rateRiderTitle'),
                textAlign: TextAlign.center, style: AuroraText.titleMedium),
            const SizedBox(height: 4),
            Text(widget.riderName,
                style: AuroraText.bodyMedium
                    .copyWith(color: AuroraColors.textSecondary)),
            const SizedBox(height: AuroraSpacing.xl),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (i) {
                final filled = i < _stars;
                return GestureDetector(
                  onTap: () {
                    Haptics.selection();
                    setState(() => _stars = i + 1);
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: Icon(
                      filled ? Icons.star_rounded : Icons.star_outline_rounded,
                      size: 44,
                      color: filled ? AuroraColors.gold : AuroraColors.textHint,
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: AuroraSpacing.xl),
            AuroraButton.primary(
              label: tr('submitRating'),
              loading: _busy,
              onPressed: _stars > 0 ? _submit : null,
            ),
            const SizedBox(height: AuroraSpacing.sm),
            TextButton(
              onPressed: _busy ? null : () => Navigator.of(context).pop(),
              child: Text(tr('skip'),
                  style: AuroraText.bodyMedium
                      .copyWith(color: AuroraColors.textSecondary)),
            ),
          ],
        ),
      ),
    );
  }
}
