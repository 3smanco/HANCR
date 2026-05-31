import '../../core/i18n/app_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../blocs/wallet/wallet_bloc.dart';
import '../../blocs/wallet/wallet_event.dart';
import '../../blocs/wallet/wallet_state.dart';
import '../../core/models/wallet_model.dart';
import '../../core/widgets/aurora/aurora.dart';

/// AuroraDriverWalletScreen — محفظة السائق بنمط Aurora.
class AuroraDriverWalletScreen extends StatelessWidget {
  const AuroraDriverWalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<WalletBloc>(
      create: (_) => WalletBloc()..add(const WalletLoadRequested()),
      child: const _View(),
    );
  }
}

class _View extends StatelessWidget {
  const _View();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AuroraColors.obsidian,
      body: AuroraBackground(
        child: BlocConsumer<WalletBloc, WalletState>(
          listenWhen: (p, c) => c is WalletLoaded && c.toast != null,
          listener: (ctx, state) {
            if (state is WalletLoaded && state.toast != null) {
              ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
                content: Text(state.toast!),
                backgroundColor: AuroraColors.ember,
              ));
              ctx.read<WalletBloc>().add(const WalletToastCleared());
            }
          },
          builder: (context, state) {
            if (state is WalletInitial || state is WalletLoading) {
              return const Center(
                child: CircularProgressIndicator(color: AuroraColors.ember),
              );
            }
            if (state is WalletError) {
              return _errorView(context, state.message);
            }
            final loaded = state is WalletLoaded
                ? state
                : (state as WalletWithdrawalInProgress).previous;
            final withdrawing = state is WalletWithdrawalInProgress;
            return _content(context, loaded, withdrawing);
          },
        ),
      ),
    );
  }

  Widget _content(BuildContext ctx, WalletLoaded state, bool withdrawing) {
    return SafeArea(
      child: Stack(
        children: [
          RefreshIndicator(
            color: AuroraColors.ember,
            backgroundColor: AuroraColors.ash,
            onRefresh: () async {
              ctx.read<WalletBloc>().add(const WalletLoadRequested());
              await Future<void>.delayed(const Duration(milliseconds: 600));
            },
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: AuroraSpacing.lg),
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                _topBar(ctx),
                const SizedBox(height: AuroraSpacing.xl),
                _balanceCard(ctx, state.wallet),
                const SizedBox(height: AuroraSpacing.xl),
                _txHeader(state.transactions.length),
                const SizedBox(height: AuroraSpacing.md),
                if (state.transactions.isEmpty)
                  _empty()
                else
                  ...state.transactions.map((t) => Padding(
                    padding: const EdgeInsets.only(bottom: AuroraSpacing.sm),
                    child: _txRow(t),
                  )),
                const SizedBox(height: AuroraSpacing.huge),
              ],
            ),
          ),
          if (withdrawing)
            Container(
              color: Colors.black.withValues(alpha: 0.5),
              child: const Center(
                child: CircularProgressIndicator(color: AuroraColors.ember),
              ),
            ),
        ],
      ),
    );
  }

  Widget _topBar(BuildContext ctx) {
    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AuroraColors.ash,
            shape: BoxShape.circle,
            border: Border.all(color: AuroraColors.border),
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => Navigator.of(ctx).pop(),
              customBorder: const CircleBorder(),
              child: const Icon(Icons.arrow_back,
                  color: AuroraColors.pearl, size: 20),
            ),
          ),
        ),
        const SizedBox(width: AuroraSpacing.md),
        Text(tr('myWallet'), style: AuroraText.titleLarge),
      ],
    );
  }

  Widget _balanceCard(BuildContext ctx, WalletModel w) {
    final fmt = NumberFormat('#,##0.00', 'ar');
    final canWithdraw = w.balance >= 50;
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
              const Icon(Icons.savings, color: AuroraColors.pearl, size: 20),
              const SizedBox(width: AuroraSpacing.sm),
              Text(
                tr('availableEarnings'),
                style: AuroraText.bodyMedium.copyWith(
                  color: AuroraColors.pearl.withValues(alpha: 0.9),
                ),
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.md),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                fmt.format(w.balance),
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
                  w.currency,
                  style: AuroraText.titleSmall.copyWith(
                    color: AuroraColors.pearl,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AuroraSpacing.lg),
          Material(
            color: canWithdraw
                ? AuroraColors.pearl
                : AuroraColors.pearl.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(AuroraRadius.md),
            child: InkWell(
              borderRadius: BorderRadius.circular(AuroraRadius.md),
              onTap: canWithdraw ? () => _showWithdrawal(ctx, w) : null,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: AuroraSpacing.md),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.account_balance,
                      color: canWithdraw
                          ? AuroraColors.emberDeep
                          : AuroraColors.pearl.withValues(alpha: 0.6),
                      size: 20,
                    ),
                    const SizedBox(width: AuroraSpacing.sm),
                    Text(
                      canWithdraw
                          ? tr('requestWithdrawal')
                          : 'الحد الأدنى 50 ${w.currency}',
                      style: AuroraText.titleSmall.copyWith(
                        color: canWithdraw
                            ? AuroraColors.emberDeep
                            : AuroraColors.pearl.withValues(alpha: 0.7),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _txHeader(int count) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(tr('transactions'), style: AuroraText.titleMedium),
        Container(
          padding: const EdgeInsets.symmetric(
              horizontal: AuroraSpacing.sm, vertical: 2),
          decoration: BoxDecoration(
            color: AuroraColors.emberMute.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(AuroraRadius.pill),
          ),
          child: Text(
            '$count',
            style: AuroraText.caption.copyWith(
              color: AuroraColors.ember,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }

  Widget _txRow(WalletTransactionModel tx) {
    final fmt = NumberFormat('#,##0.00', 'ar');
    final date = DateFormat('dd MMM, HH:mm', 'ar');
    final isCredit = tx.direction.isCredit;
    final isPending = tx.status == WalletTransactionStatus.pending;

    return AuroraCard(
      padding: const EdgeInsets.symmetric(
          horizontal: AuroraSpacing.lg, vertical: AuroraSpacing.md),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isCredit
                  ? AuroraColors.success.withValues(alpha: 0.15)
                  : AuroraColors.emberMute.withValues(alpha: 0.3),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _iconForType(tx.type),
              color: isCredit ? AuroraColors.success : AuroraColors.ember,
              size: 22,
            ),
          ),
          const SizedBox(width: AuroraSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tx.type.label,
                    style: AuroraText.titleSmall.copyWith(fontSize: 14)),
                const SizedBox(height: 2),
                Text(date.format(tx.createdAt.toLocal()),
                    style: AuroraText.caption),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${tx.direction.sign}${fmt.format(tx.amount)} ${tx.currency}',
                style: AuroraText.titleSmall.copyWith(
                  fontSize: 14,
                  color: isCredit ? AuroraColors.success : AuroraColors.pearl,
                ),
              ),
              if (isPending)
                Container(
                  margin: const EdgeInsets.only(top: 2),
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                  decoration: BoxDecoration(
                    color: AuroraColors.warningBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    tr('pendingApproval'),
                    style: AuroraText.caption.copyWith(
                      color: AuroraColors.warning,
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  IconData _iconForType(WalletTransactionType t) {
    switch (t) {
      case WalletTransactionType.driverEarnings:
        return Icons.attach_money;
      case WalletTransactionType.driverWithdrawal:
        return Icons.account_balance;
      case WalletTransactionType.tip:
        return Icons.favorite;
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
          Text(tr('noTransactions'), style: AuroraText.titleSmall),
        ],
      ),
    );
  }

  Widget _errorView(BuildContext ctx, String msg) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AuroraSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline,
                color: AuroraColors.danger, size: 64),
            const SizedBox(height: AuroraSpacing.md),
            Text(msg, style: AuroraText.bodyMedium, textAlign: TextAlign.center),
            const SizedBox(height: AuroraSpacing.lg),
            AuroraButton.primary(
              label: tr('retry'),
              fullWidth: false,
              onPressed: () =>
                  ctx.read<WalletBloc>().add(const WalletLoadRequested()),
            ),
          ],
        ),
      ),
    );
  }

  void _showWithdrawal(BuildContext context, WalletModel w) {
    final bloc = context.read<WalletBloc>();
    final ctrl = TextEditingController();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) {
        return Container(
          decoration: const BoxDecoration(
            color: AuroraColors.coal,
            borderRadius: BorderRadius.vertical(
                top: Radius.circular(AuroraRadius.xxl)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(sheetCtx).viewInsets.bottom,
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(AuroraSpacing.xl),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 48,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AuroraColors.border,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: AuroraSpacing.lg),
                  Text(tr('requestWithdrawal'), style: AuroraText.titleLarge),
                  const SizedBox(height: 4),
                  Text(
                    'الرصيد المتاح: ${w.balance.toStringAsFixed(2)} ${w.currency}',
                    style: AuroraText.bodySmall,
                  ),
                  const SizedBox(height: AuroraSpacing.xl),
                  TextField(
                    controller: ctrl,
                    keyboardType: TextInputType.number,
                    style: AuroraText.titleLarge,
                    decoration: InputDecoration(
                      hintText: tr('amount'),
                      suffix: Text(w.currency, style: AuroraText.bodyMedium),
                    ),
                  ),
                  const SizedBox(height: AuroraSpacing.xl),
                  AuroraButton.primary(
                    label: 'طلب السحب',
                    icon: Icons.account_balance,
                    onPressed: () {
                      final amt = double.tryParse(ctrl.text) ?? 0;
                      if (amt > 0 && amt <= w.balance) {
                        bloc.add(WalletWithdrawalRequested(amt));
                        Navigator.of(sheetCtx).pop();
                      }
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
