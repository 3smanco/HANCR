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

/// الحالة الرئيسية — رصيد + معاملات + رسالة عابرة بعد طلب سحب ناجح.
class WalletLoaded extends WalletState {
  final WalletModel wallet;
  final List<WalletTransactionModel> transactions;

  /// رسالة عابرة عن آخر إجراء (مثلاً: "تم تقديم طلب سحب 200 SAR — في انتظار الموافقة")
  final String? toast;

  const WalletLoaded({
    required this.wallet,
    required this.transactions,
    this.toast,
  });

  WalletLoaded copyWith({
    WalletModel? wallet,
    List<WalletTransactionModel>? transactions,
    String? toast,
    bool clearToast = false,
  }) {
    return WalletLoaded(
      wallet: wallet ?? this.wallet,
      transactions: transactions ?? this.transactions,
      toast: clearToast ? null : (toast ?? this.toast),
    );
  }

  @override
  List<Object?> get props => [wallet, transactions, toast];
}

class WalletError extends WalletState {
  final String message;
  const WalletError(this.message);
  @override
  List<Object?> get props => [message];
}

/// عملية السحب جارية (يُعرض loading فوق الحالة الحالية)
class WalletWithdrawalInProgress extends WalletState {
  final WalletLoaded previous;
  const WalletWithdrawalInProgress(this.previous);
  @override
  List<Object?> get props => [previous];
}
