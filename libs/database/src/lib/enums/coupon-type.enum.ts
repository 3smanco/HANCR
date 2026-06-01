/**
 * نوع الكوبون — يحدد طريقة حساب الخصم
 */
export enum CouponType {
  /** نسبة مئوية من الأجرة (value = 0..100) */
  Percent = 'Percent',
  /** مبلغ ثابت يُخصم من الأجرة (value = المبلغ) */
  Fixed = 'Fixed',
}
