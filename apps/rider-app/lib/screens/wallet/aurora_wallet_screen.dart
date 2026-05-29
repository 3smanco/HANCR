import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../blocs/wallet/wallet_bloc.dart';
import '../../blocs/wallet/wallet_event.dart';
import '../../blocs/wallet/wallet_state.dart';
import '../../core/models/wallet_model.dart';
import '../../core/widgets/aurora/aurora.dart';
import 'aurora_add_funds_sheet.dart';

/// AuroraWalletScreen — شاشة المحفظة كاملة بنمط Aurora.
class AuroraWalletScreen extends StatelessWidget {
  const AuroraWalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<WalletBloc>(
      create: (_) => WalletBloc()..add(const WalletLoadRequested()),
      child: const _WalletView(),
    );
  }
}

class _WalletView extends StatelessWidget {
  const _WalletView();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        child: BlocBuilder<WalletBloc, WalletState>(
          builder: (context, state) {
            if (state is WalletInitial || state is WalletLoading) {
              return const Center(
                child: CircularProgressIndicator(color: AuroraColors.ember),
              );
            }
            if (state is WalletError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(AuroraSpacing.xxl),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline,
                          color: AuroraColors.danger, size: 64),
                      const SizedBox(height: AuroraSpacing.md),
                      Text(state.message, style: AuroraText.bodyMedium),
                      const SizedBox(height: AuroraSpacing.lg),
                      AuroraButton.primary(
                        label: 'إعادة المحاولة',
                        fullWidth: false,
                        onPressed: () => context
                            .read<WalletBloc>()
                            .add(const WalletLoadRequested()),
                      ),
                    ],
                  ),
                ),
              );
            }
            if (state is WalletLoaded) {
              return _buildContent(context, state);
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WalletLoaded state) {
    return SafeArea(
      child: RefreshIndicator(
        color: AuroraColors.ember,
        backgroundColor: AuroraColors.ash,
        onRefresh: () async {
          context.read<WalletBloc>().add(const WalletLoadRequested());
          await Future<void>.delayed(const Duration(milliseconds: 600));
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            // ─── Top bar ───
            const SizedBox(height: AuroraSpacing.md),
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AuroraColors.ash,
                    shape: BoxShape.circle,
                    border: Border.all(color: AuroraColors.border),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => Navigator.of(context).pop(),
                      customBorder: const CircleBorder(),
                      child: const Icon(Icons.arrow_back,
                          color: AuroraColors.pearl, size: 20),
                    ),
                  ),
                ),
                const SizedBox(width: AuroraSpacing.md),
                Text('المحفظة', style: AuroraText.titleLarge),
              ],
            ),

            const SizedBox(height: AuroraSpacing.xl),

            // ─── Balance card (hero) ───
            _balanceCard(context, state.wallet),

            const SizedBox(height: AuroraSpacing.lg),

            // ─── Quick actions ───
            _quickActions(context, state.wallet),

            const SizedBox(height: AuroraSpacing.xxl),

            // ─── Transactions header ───
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('المعاملات', style: AuroraText.titleMedium),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AuroraSpacing.sm, vertical: 2),
                  decoration: BoxDecoration(
                    color: AuroraColors.emberMute.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(AuroraRadius.pill),
                  ),
                  child: Text(
                    '${state.transactions.length}',
                    style: AuroraText.caption.copyWith(
                      color: AuroraColors.ember,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AuroraSpacing.md),

            if (state.transactions.isEmpty)
              _empty()
            else
              ...state.transactions.map(
                (t) => Padding(
                  padding: const EdgeInsets.only(bottom: AuroraSpacing.sm),
                  child: _txRow(t),
                ),
              ),

            const SizedBox(height: AuroraSpacing.huge),
          ],
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  Widget _balanceCard(BuildContext context, WalletModel wallet) {
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
              const Icon(Icons.account_balance_wallet,
                  color: AuroraColors.pearl, size: 20),
              const SizedBox(width: AuroraSpacing.sm),
              Text(
                'الرصيد المتاح',
                style: AuroraText.bodyMedium.copyWith(
                  color: AuroraColors.pearl.withValues(alpha: 0.85),
                ),
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.md),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                fmt.format(wallet.balance),
                style: AuroraText.displayLarge.copyWith(
                  color: AuroraColors.pearl,
                  fontSize: 44,
                  height: 1,
                ),
              ),
              const SizedBox(width: AuroraSpacing.sm),
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  wallet.currency,
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

  Widget _quickActions(BuildContext context, WalletModel wallet) {
    return Row(
      children: [
        Expanded(
          child: _actionBtn(
            icon: Icons.add,
            label: 'شحن',
            primary: true,
            onTap: () => _openRecharge(context, wallet),
          ),
        ),
        const SizedBox(width: AuroraSpacing.md),
        Expanded(
          child: _actionBtn(
            icon: Icons.send_outlined,
            label: 'إرسال',
            onTap: () => AuroraToast.comingSoon(context, feature: 'إرسال الأموال'),
          ),
        ),
        const SizedBox(width: AuroraSpacing.md),
        Expanded(
          child: _actionBtn(
            icon: Icons.receipt_long_outlined,
            label: 'كشف',
            onTap: () =>
                AuroraToast.comingSoon(context, feature: 'كشف PDF'),
          ),
        ),
      ],
    );
  }

  Widget _actionBtn({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool primary = false,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AuroraRadius.lg),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AuroraSpacing.lg),
          decoration: BoxDecoration(
            color: primary
                ? AuroraColors.ember.withValues(alpha: 0.15)
                : AuroraColors.ash,
            borderRadius: BorderRadius.circular(AuroraRadius.lg),
            border: Border.all(
              color: primary ? AuroraColors.ember : AuroraColors.border,
              width: primary ? 1.5 : 1,
            ),
            boxShadow: primary ? AuroraShadows.iconGlow : null,
          ),
          child: Column(
            children: [
              Icon(icon, color: AuroraColors.ember, size: 22),
              const SizedBox(height: 6),
              Text(
                label,
                style: AuroraText.bodySmall.copyWith(
                  color: AuroraColors.pearl,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openRecharge(BuildContext context, WalletModel wallet) {
    final bloc = context.read<WalletBloc>();
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: bloc,
          child: AuroraAddFundsSheet(
            currency: wallet.currency,
            currentBalance: wallet.balance,
          ),
        ),
        fullscreenDialog: true,
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────
  Widget _txRow(WalletTransactionModel tx) {
    final fmt = NumberFormat('#,##0.00', 'ar');
    final dateFmt = DateFormat('dd MMM, HH:mm', 'ar');
    final isCredit = tx.direction.isCredit;
    final isPending = tx.status == WalletTransactionStatus.pending;
    final isFailed = tx.status == WalletTransactionStatus.failed;

    return AuroraCard(
      padding: const EdgeInsets.symmetric(
          horizontal: AuroraSpacing.lg, vertical: AuroraSpacing.md),
      child: Row(
        children: [
          // Icon avatar
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isCredit
                  ? AuroraColors.success.withValues(alpha: 0.15)
                  : AuroraColors.emberMute.withValues(alpha: 0.3),
              shape: BoxShape.circle,
              boxShadow: AuroraShadows.iconGlow,
            ),
            child: Icon(
              _iconForType(tx.type),
              color: isCredit ? AuroraColors.success : AuroraColors.ember,
              size: 22,
            ),
          ),
          const SizedBox(width: AuroraSpacing.md),
          // Title + subtitle
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx.type.label,
                  style: AuroraText.titleSmall.copyWith(fontSize: 14),
                ),
                const SizedBox(height: 2),
                Text(
                  dateFmt.format(tx.createdAt.toLocal()),
                  style: AuroraText.caption,
                ),
              ],
            ),
          ),
          // Amount + status
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${tx.direction.sign}${fmt.format(tx.amount)} ${tx.currency}',
                style: AuroraText.titleSmall.copyWith(
                  fontSize: 14,
                  color: isFailed
                      ? AuroraColors.textHint
                      : isCredit
                          ? AuroraColors.success
                          : AuroraColors.pearl,
                  decoration: isFailed ? TextDecoration.lineThrough : null,
                ),
              ),
              if (isPending || isFailed) ...[
                const SizedBox(height: 2),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 6, vertical: 1),
                  decoration: BoxDecoration(
                    color: isPending
                        ? AuroraColors.warningBg
                        : AuroraColors.dangerBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    tx.status.label,
                    style: AuroraText.caption.copyWith(
                      color: isPending
                          ? AuroraColors.warning
                          : AuroraColors.danger,
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  IconData _iconForType(WalletTransactionType t) {
    switch (t) {
      case WalletTransactionType.recharge:
        return Icons.add_circle_outline;
      case WalletTransactionType.tripPayment:
        return Icons.local_taxi_outlined;
      case WalletTransactionType.cancellationFee:
        return Icons.cancel_outlined;
      case WalletTransactionType.refund:
        return Icons.replay_outlined;
      case WalletTransactionType.promoBonus:
        return Icons.card_giftcard_outlined;
      case WalletTransactionType.tip:
        return Icons.favorite_outline;
      default:
        return Icons.receipt_long;
    }
  }

  Widget _empty() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AuroraSpacing.huge),
      child: Column(
        children: [
          Icon(Icons.receipt_long_outlined,
              size: 64, color: AuroraColors.textHint),
          const SizedBox(height: AuroraSpacing.md),
          Text('لا توجد معاملات بعد', style: AuroraText.titleSmall),
          const SizedBox(height: 4),
          Text(
            'ستظهر معاملاتك هنا فور أول رحلة أو شحن',
            style: AuroraText.bodySmall,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
