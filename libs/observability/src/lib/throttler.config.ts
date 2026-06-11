import { ThrottlerOptions, seconds } from '@nestjs/throttler';

/**
 * إعداد throttler عام لكل APIs.
 *
 * هناك 3 مستويات:
 *  - default  : 100 طلب / 60 ثانية لكل IP (للـ endpoints العامة)
 *  - strict   : 10 طلبات / 60 ثانية (لـ OTP / login / SOS)
 *  - relaxed  : 600 طلب / 60 ثانية (لـ subscriptions / location updates)
 *
 * Override per-resolver عبر `@Throttle({ strict: { limit, ttl } })`.
 */
export const HANCR_THROTTLER_CONFIG: ThrottlerOptions[] = [
  {
    name: 'default',
    ttl: seconds(60),
    limit: 100,
  },
  {
    name: 'strict',
    ttl: seconds(60),
    limit: 10,
  },
  {
    name: 'relaxed',
    ttl: seconds(60),
    limit: 600,
  },
];
