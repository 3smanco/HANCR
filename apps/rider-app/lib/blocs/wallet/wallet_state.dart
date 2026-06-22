import 'package:equatable/equatable.dart';
import '../../core/models/wallet_model.dart';

abstract class WalletState extends Equatable {
  const WalletState();
  @override
  List<Object?> get props => [];
}

class WalletInitial extends WalletState {
  const WalletInitial();
}

class WalletLoading extends WalletState {
  const WalletLoading();
}

/// الحالة الرئيسية بعد التحميل — رصيد + معاملات + checkout قيد التنفيذ (إن وُجد)
class WalletLoaded extends WalletState {
  final WalletModel wallet;
  final List<WalletTransactionModel> transactions;

  /// لو موجود — يعني هناك recharge جارٍ ينتظر إكمال البوابة.
  final RechargeCheckoutModel? activeCheckout;

  const WalletLoaded({
    required this.wallet,
    required this.transactions,
    this.activeCheckout,
  });

  WalletLoaded copyWith({
    WalletModel? wallet,
    List<WalletTransactionModel>? transactions,
    RechargeCheckoutModel? activeCheckout,
    bool clearCheckout = false,
  }) {
    return WalletLoaded(
      wallet: wallet ?? this.wallet,
      transactions: transactions ?? this.transactions,
      activeCheckout:
          clearCheckout ? null : (activeCheckout ?? this.activeCheckout),
    );
  }

  @override
  List<Object?> get props => [wallet, transactions, activeCheckout];
}

class WalletError extends WalletState {
  final String message;
  const WalletError(this.message);
  @override
  List<Object?> get props => [message];
}
