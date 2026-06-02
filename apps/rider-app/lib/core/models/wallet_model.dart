import 'package:equatable/equatable.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

enum WalletTransactionType {
  recharge,
  tripPayment,
  cancellationFee,
  refund,
  promoBonus,
  loyaltyRedemption,
  adminAdjustment,
  tip,
  driverEarnings,
  driverWithdrawal,
}

enum WalletTransactionDirection { credit, debit }

enum WalletTransactionStatus { pending, completed, failed, reversed }

enum PaymentGateway {
  internal,
  hyperPay,
  moyasar,
  stripe,
  applePay,
  googlePay,
  manual,
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsers (GraphQL enum strings → Dart enum)
// ─────────────────────────────────────────────────────────────────────────────

extension WalletTransactionTypeX on WalletTransactionType {
  static WalletTransactionType fromString(String s) {
    switch (s) {
      case 'Recharge':
        return WalletTransactionType.recharge;
      case 'TripPayment':
        return WalletTransactionType.tripPayment;
      case 'CancellationFee':
        return WalletTransactionType.cancellationFee;
      case 'Refund':
        return WalletTransactionType.refund;
      case 'PromoBonus':
        return WalletTransactionType.promoBonus;
      case 'LoyaltyRedemption':
        return WalletTransactionType.loyaltyRedemption;
      case 'AdminAdjustment':
        return WalletTransactionType.adminAdjustment;
      case 'Tip':
        return WalletTransactionType.tip;
      case 'DriverEarnings':
        return WalletTransactionType.driverEarnings;
      case 'DriverWithdrawal':
        return WalletTransactionType.driverWithdrawal;
      default:
        return WalletTransactionType.adminAdjustment;
    }
  }

  String get label {
    switch (this) {
      case WalletTransactionType.recharge:
        return 'شحن المحفظة';
      case WalletTransactionType.tripPayment:
        return 'دفع رحلة';
      case WalletTransactionType.cancellationFee:
        return 'رسوم إلغاء';
      case WalletTransactionType.refund:
        return 'استرداد';
      case WalletTransactionType.promoBonus:
        return 'مكافأة ترويجية';
      case WalletTransactionType.loyaltyRedemption:
        return 'استبدال نقاط';
      case WalletTransactionType.adminAdjustment:
        return 'تعديل إداري';
      case WalletTransactionType.tip:
        return 'بقشيش';
      case WalletTransactionType.driverEarnings:
        return 'أرباح سائق';
      case WalletTransactionType.driverWithdrawal:
        return 'سحب أرباح';
    }
  }
}

extension WalletTransactionDirectionX on WalletTransactionDirection {
  static WalletTransactionDirection fromString(String s) =>
      s == 'Credit' ? WalletTransactionDirection.credit : WalletTransactionDirection.debit;

  bool get isCredit => this == WalletTransactionDirection.credit;
  String get sign => isCredit ? '+' : '−';
}

extension WalletTransactionStatusX on WalletTransactionStatus {
  static WalletTransactionStatus fromString(String s) {
    switch (s) {
      case 'Pending':
        return WalletTransactionStatus.pending;
      case 'Completed':
        return WalletTransactionStatus.completed;
      case 'Failed':
        return WalletTransactionStatus.failed;
      case 'Reversed':
        return WalletTransactionStatus.reversed;
      default:
        return WalletTransactionStatus.pending;
    }
  }

  String get label {
    switch (this) {
      case WalletTransactionStatus.pending:
        return 'قيد المعالجة';
      case WalletTransactionStatus.completed:
        return 'مكتملة';
      case WalletTransactionStatus.failed:
        return 'فشلت';
      case WalletTransactionStatus.reversed:
        return 'مستردة';
    }
  }
}

extension PaymentGatewayX on PaymentGateway {
  static PaymentGateway fromString(String s) {
    switch (s) {
      case 'Internal':
        return PaymentGateway.internal;
      case 'HyperPay':
        return PaymentGateway.hyperPay;
      case 'Moyasar':
        return PaymentGateway.moyasar;
      case 'Stripe':
        return PaymentGateway.stripe;
      case 'ApplePay':
        return PaymentGateway.applePay;
      case 'GooglePay':
        return PaymentGateway.googlePay;
      case 'Manual':
        return PaymentGateway.manual;
      default:
        return PaymentGateway.internal;
    }
  }

  String get gqlValue {
    switch (this) {
      case PaymentGateway.internal:
        return 'Internal';
      case PaymentGateway.hyperPay:
        return 'HyperPay';
      case PaymentGateway.moyasar:
        return 'Moyasar';
      case PaymentGateway.stripe:
        return 'Stripe';
      case PaymentGateway.applePay:
        return 'ApplePay';
      case PaymentGateway.googlePay:
        return 'GooglePay';
      case PaymentGateway.manual:
        return 'Manual';
    }
  }

  String get label {
    switch (this) {
      case PaymentGateway.hyperPay:
        return 'HyperPay';
      case PaymentGateway.moyasar:
        return 'مدى / مَيسر';
      case PaymentGateway.stripe:
        return 'Stripe';
      case PaymentGateway.applePay:
        return 'Apple Pay';
      case PaymentGateway.googlePay:
        return 'Google Pay';
      case PaymentGateway.internal:
        return 'داخلي';
      case PaymentGateway.manual:
        return 'يدوي';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Models
// ─────────────────────────────────────────────────────────────────────────────

class WalletModel extends Equatable {
  final double balance;
  final String currency;

  const WalletModel({required this.balance, required this.currency});

  factory WalletModel.fromJson(Map<String, dynamic> json) => WalletModel(
        balance: (json['balance'] as num).toDouble(),
        currency: json['currency'] as String,
      );

  @override
  List<Object?> get props => [balance, currency];
}

class WalletTransactionModel extends Equatable {
  final int id;
  final WalletTransactionType type;
  final WalletTransactionDirection direction;
  final double amount;
  final double balanceAfter;
  final String currency;
  final WalletTransactionStatus status;
  final PaymentGateway gateway;
  final String? gatewayRef;
  final int? orderId;
  final String? description;
  final DateTime createdAt;
  final DateTime? completedAt;

  const WalletTransactionModel({
    required this.id,
    required this.type,
    required this.direction,
    required this.amount,
    required this.balanceAfter,
    required this.currency,
    required this.status,
    required this.gateway,
    this.gatewayRef,
    this.orderId,
    this.description,
    required this.createdAt,
    this.completedAt,
  });

  factory WalletTransactionModel.fromJson(Map<String, dynamic> json) =>
      WalletTransactionModel(
        id: json['id'] as int,
        type: WalletTransactionTypeX.fromString(json['type'] as String),
        direction: WalletTransactionDirectionX.fromString(
          json['direction'] as String,
        ),
        amount: (json['amount'] as num).toDouble(),
        balanceAfter: (json['balanceAfter'] as num).toDouble(),
        currency: json['currency'] as String,
        status: WalletTransactionStatusX.fromString(json['status'] as String),
        gateway: PaymentGatewayX.fromString(json['gateway'] as String),
        gatewayRef: json['gatewayRef'] as String?,
        orderId: json['orderId'] as int?,
        description: json['description'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
        completedAt: json['completedAt'] != null
            ? DateTime.parse(json['completedAt'] as String)
            : null,
      );

  @override
  List<Object?> get props => [
        id,
        type,
        direction,
        amount,
        balanceAfter,
        currency,
        status,
        gateway,
        gatewayRef,
        orderId,
        description,
        createdAt,
        completedAt,
      ];
}

class RechargeCheckoutModel extends Equatable {
  final int transactionId;
  final String gatewayRef;
  final String? redirectUrl;
  final String? clientSecret;
  final PaymentGateway gateway;
  final double amount;
  final String currency;
  final bool simulated;

  const RechargeCheckoutModel({
    required this.transactionId,
    required this.gatewayRef,
    this.redirectUrl,
    this.clientSecret,
    required this.gateway,
    required this.amount,
    required this.currency,
    this.simulated = false,
  });

  factory RechargeCheckoutModel.fromJson(Map<String, dynamic> json) =>
      RechargeCheckoutModel(
        transactionId: json['transactionId'] as int,
        gatewayRef: json['gatewayRef'] as String,
        redirectUrl: json['redirectUrl'] as String?,
        clientSecret: json['clientSecret'] as String?,
        gateway: PaymentGatewayX.fromString(json['gateway'] as String),
        amount: (json['amount'] as num).toDouble(),
        currency: json['currency'] as String,
        simulated: json['simulated'] as bool? ?? false,
      );

  @override
  List<Object?> get props => [
        transactionId,
        gatewayRef,
        redirectUrl,
        clientSecret,
        gateway,
        amount,
        currency,
        simulated,
      ];
}
