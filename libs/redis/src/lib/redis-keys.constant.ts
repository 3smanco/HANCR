/**
 * مفاتيح Redis — نهائية لا تتغير
 * أي تغيير هنا يؤثر على المطابقة الفورية بالكامل
 */
export const RedisKeys = {
  // ===== بيانات السائقين =====
  /** GEO SET — موقع السائقين الحي */
  DriverGeo: 'hancr:driver:geo',
  /** HASH — اتجاه السيارة (0-360 درجة) */
  DriverHeading: 'hancr:driver:heading',
  /** ZSET — آخر تحديث GPS للسائق (timestamp) */
  DriverTimestamp: 'hancr:driver:time',
  /** HASH — حالة السائق: online|busy|offline */
  DriverStatus: 'hancr:driver:status',
  /** HASH — الخدمات التي يقدمها السائق */
  DriverServices: 'hancr:driver:services',

  // ===== بيانات الطلبات =====
  /** GEO SET — مواقع الطلبات النشطة */
  RequestGeo: 'hancr:request:geo',
  /** ZSET — وقت انتهاء صلاحية كل طلب */
  RequestTime: 'hancr:request:time',
  /** SET — السائقون الذين أُخطِروا بطلب معين */
  RequestDriversNotified: (orderId: number) => `hancr:request:${orderId}:notified`,

  // ===== Bid Mode =====
  /** GEO SET — مواقع المزايدات الحية */
  BidGeo: 'hancr:bid:geo',
  /** ZSET — وقت انتهاء المزايدات (30 ثانية) */
  BidTime: 'hancr:bid:time',
  /** HASH — تفاصيل المزايدة الحية */
  BidDetails: (bidId: number) => `hancr:bid:${bidId}:details`,

  // ===== Sessions =====
  /** HASH — جلسة الراكب */
  RiderSession: (riderId: number) => `hancr:session:rider:${riderId}`,
  /** HASH — جلسة السائق */
  DriverSession: (driverId: number) => `hancr:session:driver:${driverId}`,

  // ===== PubSub channels =====
  /** قناة تحديثات موقع السائق */
  DriverLocationChannel: 'hancr:pubsub:driver:location',
  /** قناة الطلبات الجديدة */
  NewOrderChannel: 'hancr:pubsub:order:new',
  /** قناة تحديثات حالة الطلب */
  OrderStatusChannel: (orderId: number) => `hancr:pubsub:order:${orderId}:status`,
  /** قناة تحديثات App Config */
  AppConfigChannel: 'hancr:pubsub:config:updated',
} as const;

/** مدة انتهاء Bid Mode بالميلي ثانية */
export const BID_EXPIRY_MS = 30_000;

/** مدة انتهاء طلب السائق بدون رد (بالثواني) */
export const ORDER_DRIVER_TIMEOUT_SECONDS = 30;

/** مدة عدم نشاط السائق قبل اعتباره offline (بالثواني) */
export const DRIVER_STALE_THRESHOLD_SECONDS = 60;
