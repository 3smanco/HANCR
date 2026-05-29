/**
 * نوع معاملة المحفظة
 *
 * Credit = إضافة (شحن، استرداد، مكافأة)
 * Debit  = خصم (دفع رحلة، رسوم إلغاء)
 */
export enum WalletTransactionType {
  /** شحن المحفظة عبر بوابة دفع */
  Recharge = 'Recharge',

  /** دفع رحلة (debit) */
  TripPayment = 'TripPayment',

  /** رسوم إلغاء (debit) */
  CancellationFee = 'CancellationFee',

  /** استرداد كامل (credit) */
  Refund = 'Refund',

  /** مكافأة ترويجية (credit) */
  PromoBonus = 'PromoBonus',

  /** استرداد جزئي عند خصم بـ miles */
  LoyaltyRedemption = 'LoyaltyRedemption',

  /** تعديل يدوي من الإدارة */
  AdminAdjustment = 'AdminAdjustment',

  /** بقشيش مدفوع للسائق (debit للراكب، credit للسائق) */
  Tip = 'Tip',

  /** تحويل أرباح للسائق (credit للسائق) */
  DriverEarnings = 'DriverEarnings',

  /** سحب أرباح السائق (debit للسائق) */
  DriverWithdrawal = 'DriverWithdrawal',
}

/** اتجاه المعاملة — Credit (+) أو Debit (−) */
export enum WalletTransactionDirection {
  Credit = 'Credit',
  Debit = 'Debit',
}

/** حالة المعاملة */
export enum WalletTransactionStatus {
  /** قيد المعالجة (مع payment gateway) */
  Pending = 'Pending',

  /** مكتملة بنجاح */
  Completed = 'Completed',

  /** فشلت (rejected/timeout) */
  Failed = 'Failed',

  /** تم استردادها */
  Reversed = 'Reversed',
}

/** نوع المالك للمعاملة */
export enum WalletOwnerType {
  Rider = 'Rider',
  Driver = 'Driver',
}

/** بوابات الدفع المدعومة */
export enum PaymentGateway {
  /** الدفع داخل المحفظة (لا gateway) */
  Internal = 'Internal',

  /** HyperPay — الخليج */
  HyperPay = 'HyperPay',

  /** Moyasar — السعودية */
  Moyasar = 'Moyasar',

  /** Stripe — international */
  Stripe = 'Stripe',

  /** Apple Pay */
  ApplePay = 'ApplePay',

  /** Google Pay */
  GooglePay = 'GooglePay',

  /** تعديل يدوي */
  Manual = 'Manual',
}
