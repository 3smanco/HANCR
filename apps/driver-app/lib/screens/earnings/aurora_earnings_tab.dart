import '../../core/i18n/app_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/driver/driver_bloc.dart';
import '../../blocs/driver/driver_state.dart';
import '../../core/utils/external_launch.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../../core/motion/motion.dart';
import '../wallet/aurora_driver_wallet_screen.dart';
import '../wallet/aurora_payout_methods_screen.dart';
import 'earnings_insights.dart';
import 'earnings_summary_strip.dart';
import '../history/aurora_trip_history_screen.dart';

/// AuroraEarningsTab — صفحة الأرباح بنمط Aurora.
class AuroraEarningsTab extends StatefulWidget {
  const AuroraEarningsTab({super.key});

  @override
  State<AuroraEarningsTab> createState() => _AuroraEarningsTabState();
}

class _AuroraEarningsTabState extends State<AuroraEarningsTab> {
  int _periodIdx = 0;
  List<String> get _periods => [tr('today'), tr('week'), tr('month'), tr('total')];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        child: SafeArea(
          child: BlocBuilder<DriverBloc, DriverState>(
            builder: (ctx, state) {
              if (state is DriverLoading) {
                return const Center(child: AuroraLoader(size: 40));
              }
              if (state is DriverLoaded) {
                final d = state.driver;
                return ListView(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AuroraSpacing.lg),
                  children: [
                    const SizedBox(height: AuroraSpacing.md),
                    Text(tr('earnings'), style: AuroraText.displayMedium),
                    const SizedBox(height: AuroraSpacing.xl),

                    // ─── Hero balance card ───
                    _balanceHero(d.balance, d.currency, d.rating),

                    const SizedBox(height: AuroraSpacing.lg),

                    // ─── Period selector ───
                    _periodSelector(),

                    const SizedBox(height: AuroraSpacing.lg),

                    // ─── Stats grid ───
                    Row(
                      children: [
                        Expanded(child: _statCard(
                          icon: Icons.directions_car,
                          label: tr('trips'),
                          value: '${d.ratingCount}',
                        ).popIn(index: 0)),
                        const SizedBox(width: AuroraSpacing.sm),
                        Expanded(child: _statCard(
                          icon: Icons.star,
                          label: tr('rating'),
                          value: d.rating.toStringAsFixed(1),
                          iconColor: AuroraColors.gold,
                        ).popIn(index: 1)),
                      ],
                    ),
                    const SizedBox(height: AuroraSpacing.sm),
                    Row(
                      children: [
                        Expanded(child: _statCard(
                          icon: Icons.timer,
                          label: tr('hours'),
                          value: '0h',
                        ).popIn(index: 2)),
                        const SizedBox(width: AuroraSpacing.sm),
                        Expanded(child: _statCard(
                          icon: Icons.straighten,
                          label: tr('kilometers'),
                          value: '0',
                        ).popIn(index: 3)),
                      ],
                    ),

                    const SizedBox(height: AuroraSpacing.lg),

                    // متاح / معلّق / إجمالي العمر (myEarningsSummary)
                    const EarningsSummaryStrip(),

                    const SizedBox(height: AuroraSpacing.lg),

                    // N10 — رؤى الأرباح: الهدف اليومي + رسم آخر 7 أيام
                    EarningsInsights(currency: d.currency),

                    const SizedBox(height: AuroraSpacing.lg),

                    // ─── Withdraw CTA ───
                    AuroraButton.primary(
                      label: tr('withdraw'),
                      icon: Icons.account_balance,
                      onPressed: d.balance > 0
                          ? () => Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) =>
                                      const AuroraDriverWalletScreen(),
                                ),
                              )
                          : null,
                    ),

                    const SizedBox(height: AuroraSpacing.md),

                    // ─── Quick menu ───
                    AuroraCard(
                      padding: EdgeInsets.zero,
                      child: Column(
                        children: [
                          _menuRow(
                            icon: Icons.history,
                            label: tr('tripHistory'),
                            subtitle: tr('pastTrips'),
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) =>
                                    const AuroraTripHistoryScreen(),
                              ),
                            ),
                          ),
                          const Divider(
                              height: 1, color: AuroraColors.divider),
                          _menuRow(
                            icon: Icons.receipt_long,
                            label: tr('statement'),
                            subtitle: tr('tripDetails'),
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) =>
                                    const AuroraDriverWalletScreen(),
                              ),
                            ),
                          ),
                          const Divider(
                              height: 1, color: AuroraColors.divider),
                          _menuRow(
                            icon: Icons.credit_card,
                            label: tr('bankAccount'),
                            subtitle: tr('notLinked'),
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => const AuroraPayoutMethodsScreen(),
                              ),
                            ),
                          ),
                          const Divider(
                              height: 1, color: AuroraColors.divider),
                          _menuRow(
                            icon: Icons.help_outline,
                            label: tr('balanceIssue'),
                            subtitle: tr('contactSupport'),
                            onTap: () => launchSupportEmail(context,
                                subject: 'مشكلة رصيد السائق'),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: AuroraSpacing.huge),
                  ],
                );
              }
              return Center(
                child: Text(tr('noData'), style: AuroraText.bodyMedium),
              );
            },
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  Widget _balanceHero(double balance, String currency, double rating) {
    return Container(
      padding: const EdgeInsets.all(AuroraSpacing.xxl),
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
              Icon(Icons.savings,
                  color: AuroraColors.pearl, size: 20),
              const SizedBox(width: AuroraSpacing.sm),
              Text(
                tr('availableToWithdraw'),
                style: AuroraText.bodyMedium.copyWith(
                  color: AuroraColors.pearl.withValues(alpha: 0.9),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AuroraSpacing.sm, vertical: 4),
                decoration: BoxDecoration(
                  color: AuroraColors.pearl.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(AuroraRadius.pill),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.star,
                        color: AuroraColors.gold, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      rating.toStringAsFixed(1),
                      style: AuroraText.caption.copyWith(
                        color: AuroraColors.pearl,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.md),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              CountUpText(
                value: balance,
                fractionDigits: 2,
                style: AuroraText.displayLarge.copyWith(
                  color: AuroraColors.pearl,
                  fontSize: 44,
                  height: 1,
                ),
              ),
              const SizedBox(width: 6),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  currency,
                  style: AuroraText.titleSmall.copyWith(
                    color: AuroraColors.pearl,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _periodSelector() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AuroraColors.ash,
        borderRadius: BorderRadius.circular(AuroraRadius.pill),
      ),
      child: Row(
        children: _periods.asMap().entries.map((e) {
          final selected = _periodIdx == e.key;
          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _periodIdx = e.key),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(vertical: AuroraSpacing.sm),
                decoration: BoxDecoration(
                  gradient: selected ? AuroraColors.emberGradient : null,
                  borderRadius: BorderRadius.circular(AuroraRadius.pill),
                  boxShadow: selected ? AuroraShadows.iconGlow : null,
                ),
                child: Center(
                  child: Text(
                    e.value,
                    style: AuroraText.bodySmall.copyWith(
                      color: selected
                          ? AuroraColors.pearl
                          : AuroraColors.textSecondary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _statCard({
    required IconData icon,
    required String label,
    required String value,
    Color? iconColor,
  }) {
    // N5 — اللون الحي ember لا يصلح كقيمة افتراضية const.
    final ic = iconColor ?? AuroraColors.ember;
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
          Container(
            padding: const EdgeInsets.all(AuroraSpacing.sm),
            decoration: BoxDecoration(
              color: ic.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: ic, size: 18),
          ),
          const SizedBox(height: AuroraSpacing.sm),
          Text(value, style: AuroraText.titleLarge),
          const SizedBox(height: 2),
          Text(label, style: AuroraText.caption),
        ],
      ),
    );
  }

  Widget _menuRow({
    required IconData icon,
    required String label,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(AuroraSpacing.md),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AuroraColors.ember.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: AuroraColors.ember, size: 20),
              ),
              const SizedBox(width: AuroraSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: AuroraText.titleSmall.copyWith(fontSize: 14)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: AuroraText.caption),
                  ],
                ),
              ),
              const Icon(Icons.chevron_left,
                  color: AuroraColors.textSecondary, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
