/**
 * أنواع الطلبات — الخدمات الأربع الأساسية في HANCR
 */
export enum OrderType {
  /** مشوار عادي من نقطة لنقطة */
  Ride = 'Ride',
  /** مشاركة مع راكب آخر */
  Rideshare = 'Rideshare',
  /** توصيل أمانات مع OTP للتسليم الآمن */
  ParcelDelivery = 'ParcelDelivery',
  /** سائق بالساعة — بدون وجهة ثابتة */
  HourlyChauffeur = 'HourlyChauffeur',
  /** حجز مسبق لوقت محدد */
  ScheduledRide = 'ScheduledRide',
}
