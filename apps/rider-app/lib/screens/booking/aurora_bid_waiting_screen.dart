import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:graphql_flutter/graphql_flutter.dart';

import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_event.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/rider_gql.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/motion/motion.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraBidWaitingScreen — بعد إرسال المزايدة: عرض عروض السائقين وقبول أحدها.
class AuroraBidWaitingScreen extends StatefulWidget {
  final double proposedPrice;
  final String currency;
  const AuroraBidWaitingScreen({
    required this.proposedPrice,
    required this.currency,
    super.key,
  });

  @override
  State<AuroraBidWaitingScreen> createState() => _AuroraBidWaitingScreenState();
}

class _AuroraBidWaitingScreenState extends State<AuroraBidWaitingScreen> {
  Timer? _poll;
  List<Map<String, dynamic>> _offers = [];
  bool _accepting = false;
  String _status = 'Open';

  @override
  void initState() {
    super.initState();
    _fetch();
    _poll = Timer.periodic(const Duration(seconds: 3), (_) => _fetch());
  }

  Future<void> _fetch() async {
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.query(QueryOptions(
        document: gql(activeBidQuery),
        fetchPolicy: FetchPolicy.networkOnly,
      ));
      final bid = res.data?['activeBid'] as Map<String, dynamic>?;
      if (!mounted) return;
      if (bid == null) {
        // انتهت أو قُبلت — تحقق من الطلب النشط
        setState(() => _status = 'Closed');
        return;
      }
      setState(() {
        _status = bid['status'] as String? ?? 'Open';
        _offers = ((bid['offers'] as List<dynamic>?) ?? [])
            .cast<Map<String, dynamic>>();
      });
    } catch (_) {/* تجاهل أخطاء polling العابرة */}
  }

  Future<void> _accept(int offerId) async {
    setState(() => _accepting = true);
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(acceptBidOfferMutation),
        variables: {'offerId': offerId},
      ));
      if (res.hasException) throw res.exception!;
      _poll?.cancel();
      if (!mounted) return;
      // الطلب أُنشئ (DriverAccepted) — حدّث OrderBloc ليوجّه التتبع
      context.read<OrderBloc>().add(const OrderActiveCheckRequested());
      context.go('/tracking');
    } catch (e) {
      if (mounted) {
        setState(() => _accepting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$e'), backgroundColor: AuroraColors.danger),
        );
      }
    }
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      appBar: AppBar(
        backgroundColor: AuroraColors.obsidian,
        elevation: 0,
        iconTheme: IconThemeData(color: AuroraColors.pearl),
        title: Text(tr('bidMode'), style: AuroraText.titleMedium),
      ),
      body: AuroraBackground(
        child: SafeArea(
          top: false,
          child: Column(
            children: [
              // سعرك المقترح
              Container(
                margin: const EdgeInsets.all(AuroraSpacing.lg),
                padding: const EdgeInsets.all(AuroraSpacing.lg),
                decoration: BoxDecoration(
                  gradient: AuroraColors.emberGradient,
                  borderRadius: BorderRadius.circular(AuroraRadius.lg),
                  boxShadow: AuroraShadows.emberGlow,
                ),
                child: Column(
                  children: [
                    Text(tr('yourPrice'),
                        style: AuroraText.bodySmall
                            .copyWith(color: AuroraColors.pearl)),
                    const SizedBox(height: 4),
                    Text(
                      '${widget.proposedPrice.toStringAsFixed(0)} ${widget.currency}',
                      style: AuroraText.displayMedium
                          .copyWith(color: AuroraColors.pearl),
                    ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: AuroraSpacing.lg),
                child: Row(
                  children: [
                    if (_status == 'Open')
                      SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: AuroraColors.ember),
                      ),
                    const SizedBox(width: AuroraSpacing.sm),
                    Text(
                      _offers.isEmpty ? tr('waitingOffers') : tr('offersReceived'),
                      style: AuroraText.titleSmall,
                    ),
                  ],
                ),
              ),

              Expanded(
                child: _offers.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // N7 — حلقة نابضة أثناء انتظار العروض (ripple)
                            PulseRing(
                              color: AuroraColors.ember,
                              size: 56,
                              maxScale: 1.8,
                              child: Icon(Icons.gavel,
                                  color: AuroraColors.ember, size: 40),
                            ),
                            const SizedBox(height: AuroraSpacing.md),
                            Text(tr('noOffersYet'),
                                style: AuroraText.bodyMedium),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(AuroraSpacing.lg),
                        itemCount: _offers.length,
                        // N7 — كل عرض جديد يقفز للداخل (bid bounce)
                        itemBuilder: (_, i) => _offerCard(_offers[i]).popIn(index: i),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _offerCard(Map<String, dynamic> o) {
    final name = o['driverName'] as String? ?? tr('driver');
    final rating = (o['driverRating'] as num?)?.toDouble() ?? 5.0;
    final price = (o['offeredPrice'] as num?)?.toDouble() ?? 0;
    final car = [o['carBrand'], o['carModel']]
        .where((e) => e != null && '$e'.isNotEmpty)
        .join(' ');
    return Container(
      margin: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      padding: const EdgeInsets.all(AuroraSpacing.md),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.md),
        border: Border.all(color: AuroraColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: AuroraColors.emberGradient,
              shape: BoxShape.circle,
            ),
            child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: AuroraText.titleSmall
                    .copyWith(color: AuroraColors.pearl)),
          ),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: AuroraText.titleSmall),
                Row(children: [
                  Icon(Icons.star, color: AuroraColors.gold, size: 13),
                  const SizedBox(width: 2),
                  Text(rating.toStringAsFixed(1), style: AuroraText.caption),
                  if (car.isNotEmpty) ...[
                    const SizedBox(width: 6),
                    Flexible(child: Text('• $car', style: AuroraText.caption)),
                  ],
                ]),
              ],
            ),
          ),
          const SizedBox(width: AuroraSpacing.sm),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${price.toStringAsFixed(0)} ${widget.currency}',
                  style: AuroraText.titleSmall
                      .copyWith(color: AuroraColors.ember)),
              const SizedBox(height: 4),
              GestureDetector(
                onTap: _accepting ? null : () => _accept(o['id'] as int),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AuroraSpacing.md, vertical: 6),
                  decoration: BoxDecoration(
                    color: AuroraColors.ember,
                    borderRadius: BorderRadius.circular(AuroraRadius.pill),
                  ),
                  child: Text(tr('acceptOffer'),
                      style: AuroraText.caption.copyWith(
                          color: AuroraColors.pearl,
                          fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
