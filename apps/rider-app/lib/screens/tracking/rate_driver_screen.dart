import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import '../../blocs/order/order_bloc.dart';
import '../../blocs/order/order_event.dart';
import '../../blocs/order/order_state.dart';
import '../../core/theme/app_theme.dart';

class RateDriverScreen extends StatefulWidget {
  const RateDriverScreen({super.key});

  @override
  State<RateDriverScreen> createState() => _RateDriverScreenState();
}

class _RateDriverScreenState extends State<RateDriverScreen> {
  double _rating = 5.0;
  final _commentCtrl = TextEditingController();
  double _tip = 0;

  static const _tips = [0.0, 2.0, 5.0, 10.0];

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<OrderBloc, OrderState>(
      builder: (ctx, state) {
        if (state is! OrderAwaitingReview) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final order = state.order;

        return Scaffold(
          appBar: AppBar(
            automaticallyImplyLeading: false,
            title: const Text('Rate your ride'),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                // Trip summary
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: HancrColors.surfaceVariant,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Trip fare',
                            style:
                                Theme.of(context).textTheme.bodyMedium,
                          ),
                          Text(
                            '${order.paidAmount.toStringAsFixed(0)} ${order.currency}',
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(color: HancrColors.primary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            order.distanceLabel,
                            style:
                                Theme.of(context).textTheme.bodySmall,
                          ),
                          Text(
                            order.durationLabel,
                            style:
                                Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Driver avatar & name
                if (order.driverName != null) ...[
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: HancrColors.primary,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Center(
                      child: Text(
                        order.driverName![0].toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    order.driverName!,
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  if (order.carBrand != null)
                    Text(
                      '${order.carBrand} ${order.carModel ?? ''}',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  const SizedBox(height: 24),
                ],

                // Star rating
                Text(
                  'How was your ride?',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 16),
                RatingBar.builder(
                  initialRating: 5,
                  minRating: 1,
                  allowHalfRating: false,
                  itemCount: 5,
                  itemSize: 48,
                  itemBuilder: (_, __) => const Icon(
                    Icons.star_rounded,
                    color: HancrColors.accent,
                  ),
                  onRatingUpdate: (r) => setState(() => _rating = r),
                ),
                const SizedBox(height: 24),

                // Comment
                TextField(
                  controller: _commentCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    hintText: 'Leave a comment (optional)',
                  ),
                ),
                const SizedBox(height: 20),

                // Tip
                Text(
                  'Add a tip for your driver',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 10),
                Row(
                  children: _tips.map((t) {
                    final selected = _tip == t;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _tip = t),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(
                              vertical: 12),
                          decoration: BoxDecoration(
                            color: selected
                                ? HancrColors.primary
                                : HancrColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            t == 0 ? 'None' : '+${t.toStringAsFixed(0)}',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: selected
                                  ? Colors.white
                                  : HancrColors.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 32),

                // Submit
                BlocBuilder<OrderBloc, OrderState>(
                  builder: (ctx, state) {
                    return ElevatedButton(
                      onPressed: () {
                        ctx.read<OrderBloc>().add(
                              OrderRateDriverRequested(
                                orderId: order.id,
                                rating: _rating,
                                comment: _commentCtrl.text.trim().isEmpty
                                    ? null
                                    : _commentCtrl.text.trim(),
                                tip: _tip > 0 ? _tip : null,
                              ),
                            );
                      },
                      child: const Text('Submit rating'),
                    );
                  },
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () {
                    ctx.read<OrderBloc>().add(
                          OrderRateDriverRequested(
                            orderId: order.id,
                            rating: 5,
                          ),
                        );
                  },
                  child: const Text(
                    'Skip',
                    style: TextStyle(color: HancrColors.textSecondary),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
