/**
 * نقطة جغرافية — تُستخدم في كل مكان بالمشروع
 * يُخزَّن كـ JSONB في PostgreSQL
 */
export interface GeoPoint {
  /** خط العرض */
  lat: number;
  /** خط الطول */
  lng: number;
}
