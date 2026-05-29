/**
 * حالات دورة حياة الطلب — 14 حالة كاملة
 * State Machine الذي يتحكم في كل طلب من البداية للنهاية
 */
export enum OrderStatus {
  /** الراكب أرسل الطلب — ينتظر المطابقة */
  Requested = 'Requested',
  /** لا يوجد سائق في النطاق الجغرافي */
  NotFound = 'NotFound',
  /** يوجد سائقون لكن بعيدون عن الحد المقبول */
  NoCloseFound = 'NoCloseFound',
  /** وُجد سائقون وتم إرسال الإشعارات */
  Found = 'Found',
  /** سائق قبل الطلب — في طريقه لنقطة الالتقاء */
  DriverAccepted = 'DriverAccepted',
  /** ينتظر الدفع المسبق (prepay) */
  WaitingForPrePay = 'WaitingForPrePay',
  /** السائق وصل نقطة الالتقاء */
  Arrived = 'Arrived',
  /** الرحلة بدأت رسمياً */
  Started = 'Started',
  /** ينتظر الدفع بعد الرحلة (postpay) */
  WaitingForPostPay = 'WaitingForPostPay',
  /** ينتظر تقييم الراكب للسائق */
  WaitingForReview = 'WaitingForReview',
  /** الرحلة اكتملت تماماً ✅ */
  Finished = 'Finished',
  /** السائق ألغى الطلب */
  DriverCanceled = 'DriverCanceled',
  /** الراكب ألغى الطلب */
  RiderCanceled = 'RiderCanceled',
  /** حجز مسبق — لم يبدأ بعد */
  Booked = 'Booked',
  /** انتهت مهلة القبول بدون سائق */
  Expired = 'Expired',
}
