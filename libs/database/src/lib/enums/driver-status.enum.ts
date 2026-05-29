/**
 * حالات السائق — تُحدَّث في Redis للمطابقة الفورية
 */
export enum DriverStatus {
  /** متاح لاستقبال الطلبات */
  Online = 'Online',
  /** غير متصل */
  Offline = 'Offline',
  /** في رحلة — لا يستقبل طلبات جديدة */
  Busy = 'Busy',
  /** حساب معلّق أو في انتظار الموافقة */
  Inactive = 'Inactive',
}
