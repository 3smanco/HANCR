import 'package:equatable/equatable.dart';
import '../../core/models/wallet_model.dart';

abstract class WalletEvent extends Equatable {
  const WalletEvent();
  @override
  List<Object?> get props => [];
}

/// طلب جلب الرصيد + آخر 50 معاملة
class WalletLoadRequested extends WalletEvent {
  const WalletLoadRequested();
}

/// طلب refresh الرصيد فقط (بدون إعادة جلب المعاملات)
class WalletBalanceRefreshRequested extends WalletEvent {
  const WalletBalanceRefreshRequested();
}

/// بدء عملية شحن
class WalletRechargeStarted extends WalletEvent {
  final double amount;
  final PaymentGateway gateway;
  const WalletRechargeStarted({
    required this.amount,
    required this.gateway,
  });

  @override
  List<Object?> get props => [amount, gateway];
}

/// تأكيد شحن (dev/admin tool — في الإنتاج webhook يقوم بهذا)
class WalletRechargeConfirmed extends WalletEvent {
  final int transactionId;
  const WalletRechargeConfirmed(this.transactionId);

  @override
  List<Object?> get props => [transactionId];
}
