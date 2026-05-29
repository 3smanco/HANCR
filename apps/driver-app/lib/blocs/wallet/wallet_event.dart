import 'package:equatable/equatable.dart';

abstract class WalletEvent extends Equatable {
  const WalletEvent();
  @override
  List<Object?> get props => [];
}

/// طلب جلب الرصيد + المعاملات
class WalletLoadRequested extends WalletEvent {
  const WalletLoadRequested();
}

/// تحديث الرصيد فقط
class WalletBalanceRefreshRequested extends WalletEvent {
  const WalletBalanceRefreshRequested();
}

/// طلب سحب رصيد من المحفظة إلى الحساب البنكي
class WalletWithdrawalRequested extends WalletEvent {
  final double amount;
  const WalletWithdrawalRequested(this.amount);

  @override
  List<Object?> get props => [amount];
}

/// مسح الرسالة العابرة (toast) بعد عرضها
class WalletToastCleared extends WalletEvent {
  const WalletToastCleared();
}
