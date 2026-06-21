import 'package:flutter/material.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/i18n/app_localization.dart';
import '../../core/graphql/graphql_client.dart';
import '../../core/graphql/gql/loyalty_gql.dart';
import '../../core/models/loyalty_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';
import '../../core/motion/motion.dart';

/// LoyaltyTab — HANCR Miles (نظام الولاء) بالتصميم الجديد
///
/// البنية:
/// - بطاقة Tier hero (navy → violet gradient) مع progress للمستوى التالي
/// - 2 stats: Available Miles + Lifetime Miles
/// - Perks list (Free Upgrades, Cancellation, Surge Immunity)
/// - Rewards catalog (مكافآت قابلة للاسترداد)
/// - "كيف تكسب miles" — قواعد الكسب
class LoyaltyTab extends StatefulWidget {
  const LoyaltyTab({super.key});

  @override
  State<LoyaltyTab> createState() => _LoyaltyTabState();
}

class _LoyaltyTabState extends State<LoyaltyTab> {
  LoyaltyModel? _loyalty;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final client = await GraphQLClientManager.get();
      final result = await client.query(
        QueryOptions(document: gql(myLoyaltyQuery)),
      );
      final data = result.data?['myLoyalty'] as Map<String, dynamic>?;
      if (!mounted) return;
      setState(() {
        _loyalty = data != null ? LoyaltyModel.fromJson(data) : null;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _redeem(int cost, String title) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dctx) => AlertDialog(
        title: Text(tr('redeemReward')),
        content: Text('$title — $cost ${tr('availableMiles')}؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dctx, false),
            child: Text(tr('cancel')),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dctx, true),
            child: Text(tr('confirm')),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      final client = await GraphQLClientManager.get();
      final res = await client.mutate(MutationOptions(
        document: gql(redeemRewardMutation),
        variables: {'miles': cost},
      ));
      if (res.hasException) {
        throw Exception(res.exception?.graphqlErrors.firstOrNull?.message ??
            tr('redeemFailed'));
      }
      final d = res.data?['redeemReward'] as Map<String, dynamic>?;
      if (!mounted) return;
      final credited = (d?['creditedAmount'] as num?)?.toStringAsFixed(0) ?? '';
      final currency = d?['currency'] as String? ?? '';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${tr('redeemSuccess')} $credited $currency'),
          backgroundColor: HancrColors.success,
        ),
      );
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: HancrColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HancrColors.background,
      appBar: AppBar(
        title: const Text('Hancr Miles 🏆'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _load,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: AuroraLoader(size: 40))
          : _error != null
              ? _ErrorState(error: _error!, onRetry: _load)
              : _loyalty == null
                  ? _EmptyState(onRefresh: _load)
                  : RefreshIndicator(
                      color: HancrColors.violet,
                      onRefresh: _load,
                      child: _buildBody(_loyalty!),
                    ),
    );
  }

  Widget _buildBody(LoyaltyModel l) {
    return ListView(
      padding: const EdgeInsets.all(HancrSpacing.lg),
      children: [
        // ─── Hero Tier Card ───
        _TierHero(loyalty: l),
        const SizedBox(height: HancrSpacing.lg),

        // ─── Stats Row ───
        Row(
          children: [
            Expanded(
              child: _StatBox(
                label: tr('availableMiles'),
                value: l.availableMiles.toStringAsFixed(0),
                icon: Icons.stars_rounded,
                gradient: const LinearGradient(
                  colors: [HancrColors.violet, HancrColors.violetDeep],
                ),
              ),
            ),
            const SizedBox(width: HancrSpacing.md),
            Expanded(
              child: _StatBox(
                label: tr('lifetimeTotal'),
                value: l.lifetimeMiles.toStringAsFixed(0),
                icon: Icons.timeline_rounded,
                gradient: const LinearGradient(
                  colors: [HancrColors.navy, HancrColors.purple],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: HancrSpacing.xxl),

        // ─── Perks ───
        _SectionTitle(title: tr('yourBenefits'), icon: Icons.workspace_premium_rounded),
        const SizedBox(height: HancrSpacing.md),
        HancrCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              _PerkRow(
                icon: Icons.upgrade_rounded,
                label: tr('freeUpgrade'),
                value: '${l.freeUpgradesRemaining} متبقي',
                active: l.freeUpgradesRemaining > 0,
              ),
              const Divider(height: 1, color: HancrColors.divider),
              _PerkRow(
                icon: Icons.cancel_outlined,
                label: tr('freeCancel'),
                value: l.hasFreeCancellation ? tr('enabled') : tr('notAvailable'),
                active: l.hasFreeCancellation,
              ),
              if (l.surgeImmunityUntil != null) ...[
                const Divider(height: 1, color: HancrColors.divider),
                _PerkRow(
                  icon: Icons.shield_rounded,
                  label: tr('surgeProtection'),
                  value:
                      'حتى ${l.surgeImmunityUntil!.day}/${l.surgeImmunityUntil!.month}',
                  active: l.surgeImmunityUntil!.isAfter(DateTime.now()),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: HancrSpacing.xxl),

        // ─── Rewards Catalog ───
        _SectionTitle(title: tr('availableRewards'), icon: Icons.redeem_rounded),
        const SizedBox(height: HancrSpacing.md),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          mainAxisSpacing: HancrSpacing.md,
          crossAxisSpacing: HancrSpacing.md,
          childAspectRatio: 1.15,
          children: [
            _RewardCard(
              title: tr('discount10'),
              subtitle: tr('onNextRide'),
              cost: 500,
              available: l.availableMiles >= 500,
              icon: Icons.local_offer_rounded,
              color: HancrColors.violet,
              onRedeem: () => _redeem(500, tr('discount10')),
            ),
            _RewardCard(
              title: tr('freeUpgradePlus'),
              subtitle: tr('forPlus'),
              cost: 800,
              available: l.availableMiles >= 800,
              icon: Icons.upgrade_rounded,
              color: HancrColors.info,
              onRedeem: () => _redeem(800, tr('freeUpgradePlus')),
            ),
            _RewardCard(
              title: tr('freeRide'),
              subtitle: 'حتى 50 ر.س',
              cost: 2000,
              available: l.availableMiles >= 2000,
              icon: Icons.directions_car_rounded,
              color: HancrColors.success,
              onRedeem: () => _redeem(2000, tr('freeRide')),
            ),
            _RewardCard(
              title: tr('monthlyPack'),
              subtitle: tr('monthlyPackSub'),
              cost: 3000,
              available: l.availableMiles >= 3000,
              icon: Icons.calendar_month_rounded,
              color: const Color(0xFFD4AF37),
              onRedeem: () => _redeem(3000, tr('monthlyPack')),
            ),
          ],
        ),
        const SizedBox(height: HancrSpacing.xxl),

        // ─── How to Earn ───
        _SectionTitle(
          title: tr('howToEarnMore'),
          icon: Icons.trending_up_rounded,
        ),
        const SizedBox(height: HancrSpacing.md),
        HancrCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _EarnRow(
                icon: Icons.directions_car_rounded,
                text: tr('earn1Mile'),
                color: HancrColors.violet,
              ),
              SizedBox(height: HancrSpacing.md),
              _EarnRow(
                icon: Icons.star_rounded,
                text: tr('rateEarn'),
                color: HancrColors.warning,
              ),
              SizedBox(height: HancrSpacing.md),
              _EarnRow(
                icon: Icons.card_giftcard_rounded,
                text: tr('promoDouble'),
                color: HancrColors.success,
              ),
              SizedBox(height: HancrSpacing.md),
              _EarnRow(
                icon: Icons.group_add_rounded,
                text: tr('inviteEarn500'),
                color: HancrColors.info,
              ),
            ],
          ),
        ),
        const SizedBox(height: HancrSpacing.huge),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier Hero Card (navy gradient + tier badge + progress)
// ─────────────────────────────────────────────────────────────────────────────

class _TierHero extends StatelessWidget {
  const _TierHero({required this.loyalty});
  final LoyaltyModel loyalty;

  String _tierName() {
    switch (loyalty.tier) {
      case LoyaltyTier.bronze:
        return 'bronze';
      case LoyaltyTier.silver:
        return 'silver';
      case LoyaltyTier.gold:
        return 'gold';
      case LoyaltyTier.platinum:
        return 'platinum';
    }
  }

  String _nextTierLabel() {
    switch (loyalty.tier) {
      case LoyaltyTier.bronze:
        return tr('silver');
      case LoyaltyTier.silver:
        return tr('gold');
      case LoyaltyTier.gold:
        return tr('platinum');
      case LoyaltyTier.platinum:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isTop = loyalty.tier == LoyaltyTier.platinum;
    final remaining =
        (loyalty.tier.nextTierMiles - loyalty.lifetimeMiles).clamp(0, 99999);

    return Container(
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
          // Decorative blur circle
          Positioned(
            top: -40,
            right: -40,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: HancrColors.violet.withValues(alpha: 0.18),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  HancrTierBadge(tier: _tierName()),
                  const SizedBox(width: HancrSpacing.sm),
                  Text(
                    tr('yourTier'),
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const Spacer(),
                  const Icon(
                    Icons.workspace_premium_rounded,
                    color: Colors.white24,
                    size: 24,
                  ),
                ],
              ),
              const SizedBox(height: HancrSpacing.xl),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  CountUpText(
                    value: loyalty.totalMiles,
                    fractionDigits: 0,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 44,
                      fontWeight: FontWeight.w800,
                      height: 1.0,
                    ),
                  ),
                  const SizedBox(width: HancrSpacing.sm),
                  const Padding(
                    padding: EdgeInsets.only(bottom: 6),
                    child: Text(
                      'ميل',
                      style: TextStyle(
                        color: Colors.white60,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              if (isTop) ...[
                const SizedBox(height: HancrSpacing.md),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: HancrSpacing.md,
                    vertical: HancrSpacing.sm,
                  ),
                  decoration: BoxDecoration(
                    color: HancrColors.violet.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(HancrRadius.pill),
                  ),
                  child: const Text(
                    '🏆 وصلت لأعلى مستوى — استمتع!',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ] else ...[
                const SizedBox(height: HancrSpacing.lg),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      tr('yourProgress'),
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                    Text(
                      'للمستوى ${_nextTierLabel()}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(HancrRadius.pill),
                  child: TweenAnimationBuilder<double>(
                    tween: Tween<double>(
                        begin: 0, end: loyalty.progressToNext.clamp(0.0, 1.0)),
                    duration: Motion.dur(Motion.slow),
                    curve: Motion.decelerate,
                    builder: (_, v, __) => LinearProgressIndicator(
                      value: v,
                      backgroundColor: Colors.white24,
                      valueColor:
                          const AlwaysStoppedAnimation(HancrColors.violet),
                      minHeight: 8,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${remaining.toStringAsFixed(0)} ميل للوصول للمستوى التالي',
                  style: const TextStyle(color: Colors.white60, fontSize: 12),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-widgets
// ─────────────────────────────────────────────────────────────────────────────

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

class _PerkRow extends StatelessWidget {
  const _PerkRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.active,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(HancrSpacing.lg),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: active
                  ? HancrColors.successBg
                  : HancrColors.surfaceMute,
              borderRadius: BorderRadius.circular(HancrRadius.sm),
            ),
            child: Icon(
              icon,
              size: 18,
              color: active ? HancrColors.success : HancrColors.textHint,
            ),
          ),
          const SizedBox(width: HancrSpacing.md),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: HancrColors.textPrimary,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: active ? HancrColors.success : HancrColors.textHint,
            ),
          ),
        ],
      ),
    );
  }
}

class _RewardCard extends StatelessWidget {
  const _RewardCard({
    required this.title,
    required this.subtitle,
    required this.cost,
    required this.available,
    required this.icon,
    required this.color,
    this.onRedeem,
  });

  final String title;
  final String subtitle;
  final int cost;
  final bool available;
  final IconData icon;
  final Color color;
  final VoidCallback? onRedeem;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: available ? 1 : 0.55,
      child: HancrCard(
        onTap: available ? onRedeem : null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(HancrRadius.sm),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const Spacer(),
            Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: HancrColors.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 11,
                color: HancrColors.textSecondary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: HancrSpacing.sm),
            Row(
              children: [
                const Icon(
                  Icons.stars_rounded,
                  size: 14,
                  color: HancrColors.violet,
                ),
                const SizedBox(width: 4),
                Text(
                  '$cost',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: HancrColors.violet,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _EarnRow extends StatelessWidget {
  const _EarnRow({
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
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(HancrRadius.sm),
          ),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: HancrSpacing.md),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 13,
              color: HancrColors.textPrimary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.error, required this.onRetry});
  final String error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(HancrSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: HancrColors.errorBg,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline_rounded,
                size: 40,
                color: HancrColors.error,
              ),
            ),
            const SizedBox(height: HancrSpacing.lg),
            Text(
              tr('loadError'),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: HancrColors.textPrimary,
              ),
            ),
            const SizedBox(height: HancrSpacing.sm),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 12,
                color: HancrColors.textSecondary,
              ),
            ),
            const SizedBox(height: HancrSpacing.xl),
            HancrButton.primary(
              label: tr('retry'),
              icon: Icons.refresh_rounded,
              onPressed: onRetry,
              fullWidth: false,
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onRefresh});
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(HancrSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: HancrColors.violetLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.stars_rounded,
                size: 40,
                color: HancrColors.violet,
              ),
            ),
            const SizedBox(height: HancrSpacing.lg),
            Text(
              tr('startFirstRide'),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: HancrColors.textPrimary,
              ),
            ),
            const SizedBox(height: HancrSpacing.sm),
            Text(
              tr('startFirstRideSub'),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: HancrColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
