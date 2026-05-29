import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../blocs/driver/driver_bloc.dart';
import '../../blocs/driver/driver_state.dart';
import '../../core/widgets/aurora/aurora.dart';
import '../wallet/aurora_driver_wallet_screen.dart';

/// AuroraEarningsTab — صفحة الأرباح بنمط Aurora.
class AuroraEarningsTab extends StatefulWidget {
  const AuroraEarningsTab({super.key});

  @override
  State<AuroraEarningsTab> createState() => _AuroraEarningsTabState();
}

class _AuroraEarningsTabState extends State<AuroraEarningsTab> {
  int _periodIdx = 0;
  static const _periods = ['اليوم', 'الأسبوع', 'الشهر', 'الإجمالي'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        child: SafeArea(
          child: BlocBuilder<DriverBloc, DriverState>(
            builder: (ctx, state) {
              if (state is DriverLoading) {
                return const Center(
                  child: CircularProgressIndicator(color: AuroraColors.ember),
                );
              }
              if (state is DriverLoaded) {
                final d = state.driver;
                return ListView(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AuroraSpacing.lg),
                  children: [
                    const SizedBox(height: AuroraSpacing.md),
                    Text('الأرباح', style: AuroraText.displayMedium),
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
                          label: 'الرحلات',
                          value: '${d.ratingCount}',
                        )),
                        const SizedBox(width: AuroraSpacing.sm),
                        Expanded(child: _statCard(
                          icon: Icons.star,
                          label: 'التقييم',
                          value: d.rating.toStringAsFixed(1),
                          iconColor: AuroraColors.gold,
                        )),
                      ],
                    ),
                    const SizedBox(height: AuroraSpacing.sm),
                    Row(
                      children: [
                        Expanded(child: _statCard(
                          icon: Icons.timer,
                          label: 'الساعات',
                          value: '0h',
                        )),
                        const SizedBox(width: AuroraSpacing.sm),
                        Expanded(child: _statCard(
                          icon: Icons.straighten,
                          label: 'الكيلومترات',
                          value: '0',
                        )),
                      ],
                    ),

                    const SizedBox(height: AuroraSpacing.lg),

                    // ─── Withdraw CTA ───
                    AuroraButton.primary(
                      label: 'سحب الرصيد',
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
                            icon: Icons.receipt_long,
                            label: 'كشف الحساب',
                            subtitle: 'تفاصيل كل رحلة',
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
                            label: 'الحساب البنكي',
                            subtitle: 'لم يُربط بعد',
                            onTap: () {},
                          ),
                          const Divider(
                              height: 1, color: AuroraColors.divider),
                          _menuRow(
                            icon: Icons.help_outline,
                            label: 'مشكلة في الرصيد؟',
                            subtitle: 'تواصل مع الدعم',
                            onTap: () {},
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: AuroraSpacing.huge),
                  ],
                );
              }
              return Center(
                child: Text('لا توجد بيانات', style: AuroraText.bodyMedium),
              );
            },
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  Widget _balanceHero(double balance, String currency, double rating) {
    final fmt = NumberFormat('#,##0.00', 'ar');
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
              const Icon(Icons.savings,
                  color: AuroraColors.pearl, size: 20),
              const SizedBox(width: AuroraSpacing.sm),
              Text(
                'الأرباح المتاحة للسحب',
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
                    const Icon(Icons.star,
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
              Text(
                fmt.format(balance),
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
    Color iconColor = AuroraColors.ember,
  }) {
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
              color: iconColor.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 18),
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
