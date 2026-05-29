/**
 * حالات Bid Mode — نظام المزايدة العكسية الحصري
 */
export enum BidStatus {
  /** المزايدة مفتوحة — السائقون يقدمون عروضهم */
  Open = 'Open',
  /** الراكب قبل عرضاً — المزايدة انتهت */
  Accepted = 'Accepted',
  /** انتهت الـ 30 ثانية بدون قبول */
  Expired = 'Expired',
  /** الراكب ألغى المزايدة */
  Canceled = 'Canceled',
}
