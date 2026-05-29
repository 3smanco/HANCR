import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/driver/driver_bloc.dart';
import '../../blocs/driver/driver_event.dart';
import '../../blocs/driver/driver_state.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';

/// StarsTab — نظام نجوم القبطان (Captain Stars) بالتصميم الجديد
///
/// النظام: نجوم تُكتسب من 4 مصادر (تقييم/رحلات طويلة/ساعات الذروة/عدم إلغاء)
/// وتُترجم إلى عمولة منصة أقل في المستويات الأعلى.
class StarsTab extends StatelessWidget {
  const StarsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HancrColors.background,
      appBar: AppBar(
        title: const Text('نجوم القبطان ⭐'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => context
                .read<DriverBloc>()
                .add(const DriverStarsLoadRequested()),
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
          if (state is DriverLoaded && state.stars != null) {
            final s = state.stars!;
            return ListView(
              padding: const EdgeInsets.all(HancrSpacing.lg),
              children: [
                // ─── Hero Stars Card ───
                _StarsHero(
                  totalStars: s.totalStars,
                  progressToNext: s.progressToNext,
                  starsToNext: s.starsToNextLevel,
                  nextCommission: s.nextCommissionPercent,
                ),
                const SizedBox(height: HancrSpacing.lg),

                // ─── Star sources breakdown ───
                _SectionTitle(
                  title: 'مصادر النجوم',
                  icon: Icons.auto_awesome_rounded,
                ),
                const SizedBox(height: HancrSpacing.md),
                HancrCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      _StarRow(
                        icon: Icons.star_rounded,
                        label: 'تقييمات الركاب',
                        value: s.starsFromRating,
                        color: const Color(0xFFFBBF24),
                        bgColor: const Color(0xFFFEF3C7),
                      ),
                      const _RowDivider(),
                      _StarRow(
                        icon: Icons.route_rounded,
                        label: 'الرحلات الطويلة',
                        subtitle: 'أكثر من 30 كم',
                        value: s.starsFromLongTrips,
                        color: HancrColors.info,
                        bgColor: HancrColors.infoBg,
                      ),
                      const _RowDivider(),
                      _StarRow(
                        icon: Icons.wb_sunny_rounded,
                        label: 'ساعات الذروة',
                        subtitle: 'الصباح / المساء',
                        value: s.starsFromPeakHours,
                        color: HancrColors.warning,
                        bgColor: HancrColors.warningBg,
                      ),
                      const _RowDivider(),
                      _StarRow(
                        icon: Icons.shield_rounded,
                        label: 'بدون إلغاء',
                        subtitle: '${s.noCancelStreakWeeks} أسابيع متتالية',
                        value: s.starsFromNoCancel,
                        color: HancrColors.success,
                        bgColor: HancrColors.successBg,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: HancrSpacing.xxl),

                // ─── Commission Levels Card ───
                _SectionTitle(
                  title: 'مستويات العمولة',
                  icon: Icons.workspace_premium_rounded,
                ),
                const SizedBox(height: HancrSpacing.md),
                _CommissionLevels(
                  currentStars: s.totalStars,
                ),
                const SizedBox(height: HancrSpacing.xxl),

                // ─── How it works ───
                _SectionTitle(
                  title: 'كيف يعمل النظام',
                  icon: Icons.help_outline_rounded,
                ),
                const SizedBox(height: HancrSpacing.md),
                HancrCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      _HowItem(
                        icon: Icons.star_rounded,
                        color: Color(0xFFFBBF24),
                        text: 'نجمة لكل تقييم 5 نجوم تستلمه من الركاب',
                      ),
                      SizedBox(height: HancrSpacing.md),
                      _HowItem(
                        icon: Icons.route_rounded,
                        color: HancrColors.info,
                        text: 'نصف نجمة لكل رحلة أكثر من 30 كم',
                      ),
                      SizedBox(height: HancrSpacing.md),
                      _HowItem(
                        icon: Icons.wb_sunny_rounded,
                        color: HancrColors.warning,
                        text: '0.3 نجمة لكل رحلة في ساعة الذروة',
                      ),
                      SizedBox(height: HancrSpacing.md),
                      _HowItem(
                        icon: Icons.check_circle_rounded,
                        color: HancrColors.success,
                        text: 'نجمة أسبوعياً عند صفر إلغاءات',
                      ),
                      SizedBox(height: HancrSpacing.md),
                      _HowItem(
                        icon: Icons.refresh_rounded,
                        color: HancrColors.violet,
                        text: 'تُعاد حسبة النجوم شهرياً للتقييم العادل',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: HancrSpacing.huge),
              ],
            );
          }
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(HancrSpacing.xxl),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.auto_awesome_rounded,
                    size: 48,
                    color: HancrColors.textHint,
                  ),
                  SizedBox(height: HancrSpacing.md),
                  Text(
                    'لم تكسب نجوم بعد',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: HancrColors.textPrimary,
                    ),
                  ),
                  SizedBox(height: HancrSpacing.sm),
                  Text(
                    'أكمل رحلتك الأولى للبدء',
                    style: TextStyle(
                      fontSize: 13,
                      color: HancrColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widgets
// ─────────────────────────────────────────────────────────────────────────────

class _StarsHero extends StatelessWidget {
  const _StarsHero({
    required this.totalStars,
    required this.progressToNext,
    required this.starsToNext,
    required this.nextCommission,
  });

  final double totalStars;
  final double progressToNext;
  final double starsToNext;
  final double nextCommission;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(HancrSpacing.xl),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFFFBBF24),
            Color(0xFFD97706),
          ],
        ),
        borderRadius: BorderRadius.circular(HancrRadius.xl),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFBBF24).withValues(alpha: 0.4),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Decorative star
          Positioned(
            top: -20,
            right: -20,
            child: Icon(
              Icons.star_rounded,
              size: 140,
              color: Colors.white.withValues(alpha: 0.15),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(HancrRadius.sm),
                    ),
                    child: const Icon(
                      Icons.workspace_premium_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: HancrSpacing.sm),
                  const Text(
                    'إجمالي نجومك',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: HancrSpacing.lg),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    totalStars.toStringAsFixed(1),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 48,
                      fontWeight: FontWeight.w800,
                      height: 1.0,
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.only(bottom: 8, left: 6),
                    child: Icon(
                      Icons.star_rounded,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: HancrSpacing.lg),
              // Progress bar
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'تقدمك للمستوى التالي',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '${(progressToNext * 100).toStringAsFixed(0)}%',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(HancrRadius.pill),
                child: LinearProgressIndicator(
                  value: progressToNext.clamp(0, 1),
                  backgroundColor: Colors.white24,
                  valueColor: const AlwaysStoppedAnimation(Colors.white),
                  minHeight: 8,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '${starsToNext.toStringAsFixed(1)} ⭐ متبقية للوصول لعمولة ${nextCommission.toStringAsFixed(0)}%',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 11,
                ),
              ),
            ],
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

class _StarRow extends StatelessWidget {
  const _StarRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    required this.bgColor,
    this.subtitle,
  });

  final IconData icon;
  final String label;
  final double value;
  final Color color;
  final Color bgColor;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(HancrSpacing.lg),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(HancrRadius.sm),
            ),
            child: Icon(icon, color: color, size: 20),
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
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: const TextStyle(
                      fontSize: 11,
                      color: HancrColors.textSecondary,
                    ),
                  ),
                ],
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: HancrSpacing.md,
              vertical: HancrSpacing.xs,
            ),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(HancrRadius.pill),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  value.toStringAsFixed(1),
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: color,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(Icons.star_rounded, color: color, size: 14),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RowDivider extends StatelessWidget {
  const _RowDivider();
  @override
  Widget build(BuildContext context) => const Divider(
        height: 1,
        color: HancrColors.divider,
        indent: HancrSpacing.lg,
        endIndent: HancrSpacing.lg,
      );
}

class _CommissionLevels extends StatelessWidget {
  const _CommissionLevels({required this.currentStars});
  final double currentStars;

  static const _levels = [
    (threshold: 0.0, commission: 25, name: 'Bronze', color: Color(0xFFCD7F32)),
    (threshold: 50.0, commission: 22, name: 'Silver', color: Color(0xFFC0C0C0)),
    (threshold: 150.0, commission: 18, name: 'Gold', color: Color(0xFFD4AF37)),
    (threshold: 300.0, commission: 15, name: 'Platinum', color: Color(0xFF8E9DAB)),
    (threshold: 500.0, commission: 12, name: 'Diamond', color: HancrColors.violet),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: _levels.map((level) {
        final reached = currentStars >= level.threshold;
        final isCurrent = reached &&
            _levels.where((l) => l.threshold > level.threshold).every(
                  (l) => currentStars < l.threshold,
                );

        return Container(
          margin: const EdgeInsets.only(bottom: HancrSpacing.sm),
          padding: const EdgeInsets.all(HancrSpacing.md),
          decoration: BoxDecoration(
            color: isCurrent
                ? level.color.withValues(alpha: 0.1)
                : HancrColors.surface,
            border: Border.all(
              color: isCurrent ? level.color : HancrColors.divider,
              width: isCurrent ? 2 : 1,
            ),
            borderRadius: BorderRadius.circular(HancrRadius.md),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [level.color, level.color.withValues(alpha: 0.7)],
                  ),
                  shape: BoxShape.circle,
                  boxShadow: reached
                      ? [
                          BoxShadow(
                            color: level.color.withValues(alpha: 0.4),
                            blurRadius: 8,
                          ),
                        ]
                      : null,
                ),
                child: Icon(
                  reached
                      ? Icons.workspace_premium_rounded
                      : Icons.lock_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              const SizedBox(width: HancrSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          level.name,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: reached
                                ? HancrColors.textPrimary
                                : HancrColors.textHint,
                          ),
                        ),
                        if (isCurrent) ...[
                          const SizedBox(width: HancrSpacing.sm),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: level.color,
                              borderRadius: BorderRadius.circular(
                                HancrRadius.pill,
                              ),
                            ),
                            child: const Text(
                              'الحالي',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${level.threshold.toStringAsFixed(0)} ⭐ — عمولة ${level.commission}%',
                      style: TextStyle(
                        fontSize: 11,
                        color: reached
                            ? HancrColors.textSecondary
                            : HancrColors.textHint,
                      ),
                    ),
                  ],
                ),
              ),
              if (reached)
                Icon(
                  Icons.check_circle_rounded,
                  color: level.color,
                  size: 20,
                ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _HowItem extends StatelessWidget {
  const _HowItem({
    required this.icon,
    required this.text,
    required this.color,
  });

  final IconData icon;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(HancrRadius.sm),
          ),
          child: Icon(icon, size: 14, color: color),
        ),
        const SizedBox(width: HancrSpacing.md),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 13,
                color: HancrColors.textPrimary,
                fontWeight: FontWeight.w500,
                height: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
