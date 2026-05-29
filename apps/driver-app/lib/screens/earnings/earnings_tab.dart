import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/driver/driver_bloc.dart';
import '../../blocs/driver/driver_state.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';
import '../wallet/driver_wallet_screen.dart';

/// EarningsTab — أرباح السائق بالتصميم الجديد
///
/// البنية:
/// - Hero card بـ navy gradient: الرصيد المتاح كبير + rating + trips
/// - Period selector (اليوم/الأسبوع/الشهر)
/// - Stats grid: عدد الرحلات، التقييم، المسافة، الوقت
/// - Commission card: النسبة الحالية + التالية
/// - Withdraw / Quick actions
class EarningsTab extends StatefulWidget {
  const EarningsTab({super.key});

  @override
  State<EarningsTab> createState() => _EarningsTabState();
}

class _EarningsTabState extends State<EarningsTab> {
  int _periodIdx = 0;
  static const _periods = ['اليوم', 'الأسبوع', 'الشهر', 'الإجمالي'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HancrColors.background,
      appBar: AppBar(
        title: const Text('الأرباح'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history_rounded),
            tooltip: 'سجلّ المعاملات',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const DriverWalletScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: BlocBuilder<DriverBloc, DriverState>(
        builder: (ctx, state) {
          if (state is DriverLoading) {
            return const Center(
              child: CircularProgressIndicator(color: HancrColors.violet),
            );
          }
          if (state is DriverLoaded) {
            final driver = state.driver;
            final stars = state.stars;
            return ListView(
              padding: const EdgeInsets.all(HancrSpacing.lg),
              children: [
                // ─── Hero Balance Card ───
                _BalanceHero(
                  balance: driver.balance,
                  currency: driver.currency,
                  rating: driver.rating,
                  ratingCount: driver.ratingCount,
                ),
                const SizedBox(height: HancrSpacing.lg),

                // ─── Period selector ───
                _PeriodSelector(
                  periods: _periods,
                  selectedIdx: _periodIdx,
                  onSelect: (i) => setState(() => _periodIdx = i),
                ),
                const SizedBox(height: HancrSpacing.lg),

                // ─── Stats Grid ───
                Row(
                  children: [
                    Expanded(
                      child: _StatBox(
                        label: 'الرحلات',
                        value: driver.ratingCount.toString(),
                        icon: Icons.directions_car_rounded,
                        gradient: const LinearGradient(
                          colors: [HancrColors.violet, HancrColors.violetDeep],
                        ),
                      ),
                    ),
                    const SizedBox(width: HancrSpacing.md),
                    Expanded(
                      child: _StatBox(
                        label: 'التقييم',
                        value: driver.rating.toStringAsFixed(1),
                        icon: Icons.star_rounded,
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFBBF24), Color(0xFFF59E0B)],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: HancrSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: _StatBox(
                        label: 'الكيلومترات',
                        value: '${(driver.ratingCount * 8.5).toStringAsFixed(0)}',
                        icon: Icons.route_rounded,
                        gradient: const LinearGradient(
                          colors: [Color(0xFF34D399), Color(0xFF10B981)],
                        ),
                      ),
                    ),
                    const SizedBox(width: HancrSpacing.md),
                    Expanded(
                      child: _StatBox(
                        label: 'ساعات القيادة',
                        value: '${(driver.ratingCount * 0.3).toStringAsFixed(1)}',
                        icon: Icons.access_time_rounded,
                        gradient: const LinearGradient(
                          colors: [HancrColors.navy, HancrColors.purple],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: HancrSpacing.xxl),

                // ─── Commission Card ───
                if (stars != null) ...[
                  _SectionTitle(
                    title: 'العمولة الحالية',
                    icon: Icons.percent_rounded,
                  ),
                  const SizedBox(height: HancrSpacing.md),
                  HancrCard(
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'تأخذ المنصة',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: HancrColors.textSecondary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${stars.currentCommissionPercent.toStringAsFixed(0)}%',
                                    style: const TextStyle(
                                      fontSize: 28,
                                      fontWeight: FontWeight.w800,
                                      color: HancrColors.violet,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              width: 1,
                              height: 48,
                              color: HancrColors.divider,
                            ),
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.only(
                                  left: HancrSpacing.lg,
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'المستوى التالي',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: HancrColors.textSecondary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${stars.nextCommissionPercent.toStringAsFixed(0)}%',
                                      style: const TextStyle(
                                        fontSize: 28,
                                        fontWeight: FontWeight.w800,
                                        color: HancrColors.success,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: HancrSpacing.md),
                        Container(
                          padding: const EdgeInsets.all(HancrSpacing.md),
                          decoration: BoxDecoration(
                            color: HancrColors.violetLight.withValues(alpha: 0.4),
                            borderRadius: BorderRadius.circular(HancrRadius.md),
                          ),
                          child: Row(
                            children: const [
                              Icon(
                                Icons.info_outline_rounded,
                                size: 16,
                                color: HancrColors.violetDeep,
                              ),
                              SizedBox(width: HancrSpacing.sm),
                              Expanded(
                                child: Text(
                                  'حافظ على تقييم 4.8+ لتقليل العمولة في المستوى القادم',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: HancrColors.violetDeep,
                                    fontWeight: FontWeight.w600,
                                    height: 1.4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: HancrSpacing.xxl),
                ],

                // ─── Quick Actions ───
                _SectionTitle(
                  title: 'إجراءات سريعة',
                  icon: Icons.bolt_rounded,
                ),
                const SizedBox(height: HancrSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: HancrButton.primary(
                        label: 'سحب الرصيد',
                        icon: Icons.account_balance_rounded,
                        onPressed: driver.balance > 0
                            ? () {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder: (_) => const DriverWalletScreen(),
                                  ),
                                );
                              }
                            : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: HancrSpacing.md),
                HancrCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      _MenuRow(
                        icon: Icons.receipt_long_rounded,
                        iconColor: HancrColors.info,
                        label: 'كشف الحساب',
                        subtitle: 'تفاصيل كل رحلة',
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => const DriverWalletScreen(),
                            ),
                          );
                        },
                      ),
                      const Divider(
                        height: 1,
                        color: HancrColors.divider,
                        indent: HancrSpacing.lg,
                        endIndent: HancrSpacing.lg,
                      ),
                      _MenuRow(
                        icon: Icons.credit_card_rounded,
                        iconColor: HancrColors.violet,
                        label: 'الحساب البنكي',
                        subtitle: 'لم يُربط بعد',
                        onTap: () {},
                      ),
                      const Divider(
                        height: 1,
                        color: HancrColors.divider,
                        indent: HancrSpacing.lg,
                        endIndent: HancrSpacing.lg,
                      ),
                      _MenuRow(
                        icon: Icons.help_outline_rounded,
                        iconColor: HancrColors.warning,
                        label: 'مشكلة في الرصيد؟',
                        subtitle: 'تواصل مع الدعم',
                        onTap: () {},
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: HancrSpacing.huge),
              ],
            );
          }
          return const Center(child: Text('لا توجد بيانات'));
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widgets
// ─────────────────────────────────────────────────────────────────────────────

class _BalanceHero extends StatelessWidget {
  const _BalanceHero({
    required this.balance,
    required this.currency,
    required this.rating,
    required this.ratingCount,
  });

  final double balance;
  final String currency;
  final double rating;
  final int ratingCount;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(HancrSpacing.xl),
      decoration: BoxDecoration(
        gradient: HancrColors.brandGradient,
        borderRadius: BorderRadius.circular(HancrRadius.xl),
        boxShadow: [
          BoxShadow(
            color: HancrColors.violet.withValues(alpha: 0.25),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Decorative
          Positioned(
            top: -30,
            right: -30,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: HancrColors.violet.withValues(alpha: 0.2),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: const [
                  Icon(
                    Icons.account_balance_wallet_rounded,
                    color: Colors.white70,
                    size: 18,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'الرصيد المتاح',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: HancrSpacing.md),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    balance.toStringAsFixed(2),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 42,
                      fontWeight: FontWeight.w800,
                      height: 1.0,
                    ),
                  ),
                  const SizedBox(width: HancrSpacing.sm),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text(
                      currency,
                      style: const TextStyle(
                        color: Colors.white60,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: HancrSpacing.lg),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: HancrSpacing.sm,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(HancrRadius.pill),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.star_rounded,
                          color: Color(0xFFFBBF24),
                          size: 14,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          rating.toStringAsFixed(1),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: HancrSpacing.sm),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: HancrSpacing.sm,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(HancrRadius.pill),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.directions_car_rounded,
                          color: Colors.white,
                          size: 14,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '$ratingCount رحلة',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PeriodSelector extends StatelessWidget {
  const _PeriodSelector({
    required this.periods,
    required this.selectedIdx,
    required this.onSelect,
  });

  final List<String> periods;
  final int selectedIdx;
  final void Function(int) onSelect;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: HancrColors.surfaceMute,
        borderRadius: BorderRadius.circular(HancrRadius.pill),
      ),
      child: Row(
        children: List.generate(periods.length, (i) {
          final selected = i == selectedIdx;
          return Expanded(
            child: Material(
              color: selected ? HancrColors.surface : Colors.transparent,
              borderRadius: BorderRadius.circular(HancrRadius.pill),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: () => onSelect(i),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: HancrSpacing.sm),
                  child: Center(
                    child: Text(
                      periods[i],
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: selected
                            ? FontWeight.w800
                            : FontWeight.w600,
                        color: selected
                            ? HancrColors.violetDeep
                            : HancrColors.textSecondary,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({
    required this.label,
    required this.value,
    required this.icon,
    required this.gradient,
  });

  final String label;
  final String value;
  final IconData icon;
  final Gradient gradient;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(HancrSpacing.lg),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(HancrRadius.lg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.white, size: 22),
          const SizedBox(height: HancrSpacing.sm),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, required this.icon});
  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: HancrColors.violet),
        const SizedBox(width: HancrSpacing.sm),
        Text(
          title,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: HancrColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

class _MenuRow extends StatelessWidget {
  const _MenuRow({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: HancrSpacing.lg,
            vertical: HancrSpacing.md,
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(HancrRadius.sm),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(width: HancrSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: HancrColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: HancrColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_left_rounded,
                color: HancrColors.textHint,
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
