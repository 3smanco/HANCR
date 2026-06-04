/**
 * طرق الدفع المتاحة — تدعم النقد والمحافظ الرقمية والبطاقات
 */
export enum PaymentMode {
  /** نقد — الأكثر استخداماً في MENA */
  Cash = 'Cash',
  /** بطاقة محفوظة مسبقاً */
  SavedPaymentMethod = 'SavedPaymentMethod',
  /** بوابة دفع (HyperPay / Moyasar / Stripe) */
  PaymentGateway = 'PaymentGateway',
  /** محفظة HANCR الرقمية */
  Wallet = 'Wallet',
  /** حزمة رحلات مدفوعة مسبقاً (RiderEntitlement) */
  Entitlement = 'Entitlement',
}
