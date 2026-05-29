import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../blocs/wallet/wallet_bloc.dart';
import '../../blocs/wallet/wallet_event.dart';
import '../../blocs/wallet/wallet_state.dart';
import '../../core/models/wallet_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/hancr_widgets.dart';
import 'recharge_sheet.dart';

/// WalletScreen — شاشة محفظة الراكب
///
/// البنية:
/// - بطاقة الرصيد (gradient navy → violet) + زر "شحن" + زر "تحديث"
/// - بطاقة active checkout (لو في recharge جارٍ)
/// - قائمة المعاملات (transactions) مرتَّبة من الأحدث
class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});

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
      backgroundColor: HancrColors.background,
      appBar: AppBar(
        title: const Text('المحفظة 💳'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'تحديث',
            onPressed: () => context.read<WalletBloc>().add(
                  const WalletLoadRequested(),
                ),
          ),
        ],
      ),
      body: BlocBuilder<WalletBloc, WalletState>(
        builder: (context, state) {
          if (state is WalletInitial || state is WalletLoading) {
            return const Center(
              child: CircularProgressIndicator(color: HancrColors.violet),
            );
          }
          if (state is WalletError) {
            return _ErrorView(
              message: state.message,
              onRetry: () => context.read<WalletBloc>().add(
                    const WalletLoadRequested(),
                  ),
            );
          }
          if (state is WalletLoaded) {
            return RefreshIndicator(
              color: HancrColors.violet,
              onRefresh: () async {
                context.read<WalletBloc>().add(const WalletLoadRequested());
                // wait a frame so the indicator stays visible briefly
                await Future<void>.delayed(const Duration(milliseconds: 600));
              },
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                children: [
                  _BalanceCard(wallet: state.wallet),
                  if (state.activeCheckout != null) ...[
                    const SizedBox(height: 16),
                    _ActiveCheckoutCard(checkout: state.activeCheckout!),
                  ],
                  const SizedBox(height: 24),
                  _TransactionsHeader(count: state.transactions.length),
                  const SizedBox(height: 8),
                  if (state.transactions.isEmpty)
                    const _EmptyTransactions()
                  else
                    ...state.transactions.map(
                      (t) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _TransactionTile(tx: t),
                      ),
                    ),
                ],
              ),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// بطاقة الرصيد
// ─────────────────────────────────────────────────────────────────────────────

class _BalanceCard extends StatelessWidget {
  final WalletModel wallet;
  const _BalanceCard({required this.wallet});

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat('#,##0.00', 'ar');
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: HancrColors.brandGradient,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: HancrColors.navy.withValues(alpha: 0.15),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.account_balance_wallet_rounded,
                  color: Colors.white70, size: 22),
              SizedBox(width: 8),
              Text(
                'الرصيد المتاح',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                fmt.format(wallet.balance),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 40,
                  fontWeight: FontWeight.w700,
                  height: 1,
                ),
              ),
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(
                  wallet.currency,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _BalanceAction(
                  icon: Icons.add_rounded,
                  label: 'شحن',
                  onTap: () => _openRecharge(context),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _BalanceAction(
                  icon: Icons.receipt_long_rounded,
                  label: 'كشف الحساب',
                  onTap: () {
                    // Scroll بسيط لقائمة المعاملات (مفعَّل افتراضياً عبر ListView).
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _openRecharge(BuildContext context) {
    final bloc = context.read<WalletBloc>();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => BlocProvider.value(
        value: bloc,
        child: RechargeSheet(currency: wallet.currency),
      ),
    );
  }
}

class _BalanceAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _BalanceAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.15),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Column(
            children: [
              Icon(icon, color: Colors.white, size: 22),
              const SizedBox(height: 4),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Active Checkout Card
// ─────────────────────────────────────────────────────────────────────────────

class _ActiveCheckoutCard extends StatelessWidget {
  final RechargeCheckoutModel checkout;
  const _ActiveCheckoutCard({required this.checkout});

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat('#,##0.00', 'ar');
    return HancrCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.timer_outlined, color: HancrColors.warning),
                const SizedBox(width: 8),
                Text(
                  'شحن جارٍ',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: HancrColors.textPrimary,
                  ),
                ),
                const Spacer(),
                Text(
                  '${fmt.format(checkout.amount)} ${checkout.currency}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: HancrColors.violet,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'البوابة: ${checkout.gateway.label}',
              style: const TextStyle(color: HancrColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 4),
            Text(
              'مرجع: ${checkout.gatewayRef}',
              style: const TextStyle(
                color: HancrColors.textHint,
                fontSize: 11,
                fontFamily: 'monospace',
              ),
            ),
            const SizedBox(height: 12),
            // في الإنتاج: زر يفتح redirectUrl (HyperPay/Moyasar) أو يستدعي SDK (Stripe/Apple Pay).
            // حالياً نوفر زر "تأكيد يدوي" (dev tool).
            HancrButton.outline(
              label: 'تأكيد الشحن (محاكاة)',
              onPressed: () {
                context.read<WalletBloc>().add(
                      WalletRechargeConfirmed(checkout.transactionId),
                    );
              },
              icon: Icons.check_circle_outline,
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────────────────────

class _TransactionsHeader extends StatelessWidget {
  final int count;
  const _TransactionsHeader({required this.count});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          'المعاملات',
          style: TextStyle(
            color: HancrColors.textPrimary,
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: HancrColors.violetLight,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            '$count',
            style: TextStyle(
              color: HancrColors.violetDeep,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

class _TransactionTile extends StatelessWidget {
  final WalletTransactionModel tx;
  const _TransactionTile({required this.tx});

  @override
  Widget build(BuildContext context) {
    final amountFmt = NumberFormat('#,##0.00', 'ar');
    final dateFmt = DateFormat('dd MMM, HH:mm', 'ar');
    final isCredit = tx.direction.isCredit;
    final isPending = tx.status == WalletTransactionStatus.pending;
    final isFailed = tx.status == WalletTransactionStatus.failed;

    final amountColor = isFailed
        ? HancrColors.textHint
        : isCredit
            ? HancrColors.success
            : HancrColors.textPrimary;

    return HancrCard(
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isCredit ? HancrColors.successBg : HancrColors.violetLight,
            shape: BoxShape.circle,
          ),
          child: Icon(
            _iconForType(tx.type),
            color: isCredit ? HancrColors.success : HancrColors.violetDeep,
            size: 20,
          ),
        ),
        title: Text(
          tx.type.label,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 2),
            Text(
              dateFmt.format(tx.createdAt.toLocal()),
              style: const TextStyle(
                color: HancrColors.textSecondary,
                fontSize: 11,
              ),
            ),
            if (tx.orderId != null)
              Text(
                'طلب #${tx.orderId}',
                style: TextStyle(
                  color: HancrColors.textHint,
                  fontSize: 10,
                ),
              ),
          ],
        ),
        trailing: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${tx.direction.sign}${amountFmt.format(tx.amount)} ${tx.currency}',
              style: TextStyle(
                color: amountColor,
                fontWeight: FontWeight.w700,
                fontSize: 14,
                decoration: isFailed ? TextDecoration.lineThrough : null,
              ),
            ),
            if (isPending || isFailed)
              Container(
                margin: const EdgeInsets.only(top: 2),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(
                  color: isPending
                      ? HancrColors.warningBg
                      : HancrColors.errorBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  tx.status.label,
                  style: TextStyle(
                    color: isPending ? HancrColors.warning : HancrColors.error,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ],
        ),
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
      case WalletTransactionType.loyaltyRedemption:
        return Icons.workspace_premium_outlined;
      case WalletTransactionType.tip:
        return Icons.favorite_outline;
      case WalletTransactionType.driverEarnings:
        return Icons.attach_money_outlined;
      case WalletTransactionType.driverWithdrawal:
        return Icons.account_balance_outlined;
      case WalletTransactionType.adminAdjustment:
        return Icons.tune_outlined;
    }
  }
}

class _EmptyTransactions extends StatelessWidget {
  const _EmptyTransactions();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          Icon(Icons.receipt_long_outlined,
              size: 64, color: HancrColors.textHint),
          const SizedBox(height: 12),
          Text(
            'لا توجد معاملات بعد',
            style: TextStyle(
              color: HancrColors.textSecondary,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'ستظهر معاملاتك هنا فور إجراء أول رحلة أو شحن',
            style: TextStyle(color: HancrColors.textHint, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline,
                size: 64, color: HancrColors.error),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: HancrColors.textSecondary),
            ),
            const SizedBox(height: 16),
            HancrButton.primary(
              label: 'إعادة المحاولة',
              onPressed: onRetry,
              fullWidth: false,
            ),
          ],
        ),
      ),
    );
  }
}
