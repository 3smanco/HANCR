import '../../core/i18n/app_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/driver/driver_bloc.dart';
import '../../blocs/driver/driver_state.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraStarsTab — نظام النجوم (loyalty) للسائق بنمط Aurora.
class AuroraStarsTab extends StatelessWidget {
  const AuroraStarsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        child: SafeArea(
          child: BlocBuilder<DriverBloc, DriverState>(
            builder: (ctx, state) {
              if (state is! DriverLoaded) {
                return Center(
                  child: CircularProgressIndicator(color: AuroraColors.ember),
                );
              }
              final d = state.driver;
              final stars = state.stars;
              return ListView(
                padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
                children: [
                  const SizedBox(height: AuroraSpacing.md),
                  Text('Stars ⭐', style: AuroraText.displayMedium),
                  const SizedBox(height: AuroraSpacing.xl),

                  // ─── Tier hero ───
                  Container(
                    padding: const EdgeInsets.all(AuroraSpacing.xxl),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AuroraColors.gold, AuroraColors.goldGlow],
                      ),
                      borderRadius: BorderRadius.circular(AuroraRadius.xl),
                      boxShadow: [
                        BoxShadow(
                          color: AuroraColors.gold.withValues(alpha: 0.5),
                          blurRadius: 24,
                          spreadRadius: -2,
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.workspace_premium,
                                color: AuroraColors.obsidian, size: 24),
                            const SizedBox(width: AuroraSpacing.sm),
                            Text(
                              '${(stars?.totalStars ?? 0).toStringAsFixed(1)} ⭐',
                              style: AuroraText.titleMedium.copyWith(
                                color: AuroraColors.obsidian,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AuroraSpacing.md),
                        Text(
                          'عمولة: ${((stars?.currentCommissionPercent ?? 15)).toStringAsFixed(0)}%',
                          style: AuroraText.titleLarge.copyWith(
                            color: AuroraColors.obsidian,
                            fontSize: 28,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AuroraSpacing.lg),

                  // ─── Stats ───
                  Row(
                    children: [
                      Expanded(child: _stat(
                        icon: Icons.directions_car,
                        label: tr('trips'),
                        value: '${d.ratingCount}',
                      )),
                      const SizedBox(width: AuroraSpacing.sm),
                      Expanded(child: _stat(
                        icon: Icons.star,
                        label: tr('rating'),
                        value: d.rating.toStringAsFixed(1),
                        color: AuroraColors.gold,
                      )),
                    ],
                  ),

                  const SizedBox(height: AuroraSpacing.lg),

                  // ─── Perks ───
                  Text(tr('yourBenefits'), style: AuroraText.titleMedium),
                  const SizedBox(height: AuroraSpacing.md),
                  _perk(Icons.fast_forward, tr('priorityOrders'),
                      tr('priorityOrdersSub')),
                  _perk(Icons.handshake_outlined, tr('lowerCommission'),
                      tr('lowerCommissionSub')),
                  _perk(Icons.trending_up, tr('perfRewards'),
                      tr('perfRewardsSub')),
                  const SizedBox(height: AuroraSpacing.huge),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _stat({
    required IconData icon,
    required String label,
    required String value,
    Color? color,
  }) {
    // N5 — اللون الحي ember لا يصلح كقيمة افتراضية const.
    final c = color ?? AuroraColors.ember;
    return AuroraCard(
      padding: const EdgeInsets.all(AuroraSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(AuroraSpacing.sm),
            decoration: BoxDecoration(
              color: c.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: c, size: 18),
          ),
          const SizedBox(height: AuroraSpacing.sm),
          Text(value, style: AuroraText.titleLarge),
          const SizedBox(height: 2),
          Text(label, style: AuroraText.caption),
        ],
      ),
    );
  }

  Widget _perk(IconData icon, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AuroraSpacing.sm),
      child: AuroraCard(
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AuroraSpacing.md),
              decoration: BoxDecoration(
                color: AuroraColors.gold.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: AuroraColors.gold, size: 22),
            ),
            const SizedBox(width: AuroraSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AuroraText.titleSmall),
                  const SizedBox(height: 2),
                  Text(subtitle, style: AuroraText.bodySmall),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
