import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { RedisKeys, BID_EXPIRY_MS } from './redis-keys.constant';

/** تفاصيل المزايدة الحية في Redis */
export interface BidRedisDetails {
  bidId: number;
  riderId: number;
  proposedPrice: number;
  currency: string;
  lat: number;
  lng: number;
  serviceId: number;
  regionId: number;
}

/**
 * BidRedisService — إدارة نظام المزايدة العكسية
 * كل مزايدة تعيش 30 ثانية فقط في Redis
 */
@Injectable()
export class BidRedisService {
  private readonly logger = new Logger(BidRedisService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * إنشاء مزايدة جديدة في Redis
   */
  async createBid(details: BidRedisDetails): Promise<void> {
    const { bidId, lat, lng } = details;
    const expiryAt = Date.now() + BID_EXPIRY_MS;

    const pipeline = this.redis.pipeline();

    // إضافة موقع المزايدة
    pipeline.geoadd(RedisKeys.BidGeo, lng, lat, String(bidId));

    // تعيين وقت الانتهاء
    pipeline.zadd(RedisKeys.BidTime, expiryAt, String(bidId));

    // حفظ التفاصيل
    pipeline.setex(
      RedisKeys.BidDetails(bidId),
      Math.ceil(BID_EXPIRY_MS / 1000) + 10, // ثانية إضافية للأمان
      JSON.stringify(details),
    );

    await pipeline.exec();
    this.logger.debug(`🎯 مزايدة #${bidId} أُنشئت في Redis (30 ثانية)`);
  }

  /**
   * جلب السائقين القريبين من مزايدة لإخطارهم
   */
  async findNearbyDriversForBid(
    lat: number,
    lng: number,
    radiusMeters: number,
  ): Promise<Array<{ driverId: number; distanceMeters: number }>> {
    const results = await this.redis.georadius(
      'hancr:driver:geo', // نبحث في السائقين المتاحين
      lng,
      lat,
      radiusMeters,
      'm',
      'WITHDIST',
      'ASC',
      'COUNT',
      20,
    );

    if (!results) return [];

    return (results as Array<[string, string]>).map(([id, dist]) => ({
      driverId: parseInt(id),
      distanceMeters: Math.round(parseFloat(dist)),
    }));
  }

  /**
   * جلب تفاصيل مزايدة
   */
  async getBidDetails(bidId: number): Promise<BidRedisDetails | null> {
    const data = await this.redis.get(RedisKeys.BidDetails(bidId));
    if (!data) return null;
    return JSON.parse(data) as BidRedisDetails;
  }

  /**
   * حذف مزايدة من Redis
   */
  async removeBid(bidId: number): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.zrem(RedisKeys.BidGeo, String(bidId));
    pipeline.zrem(RedisKeys.BidTime, String(bidId));
    pipeline.del(RedisKeys.BidDetails(bidId));
    await pipeline.exec();
  }

  /**
   * تنظيف المزايدات المنتهية
   */
  async cleanupExpiredBids(): Promise<number> {
    const now = Date.now();
    const expired = await this.redis.zrangebyscore(
      RedisKeys.BidTime,
      '-inf',
      now,
    );

    if (expired.length === 0) return 0;

    const pipeline = this.redis.pipeline();
    for (const bidId of expired) {
      pipeline.zrem(RedisKeys.BidGeo, bidId);
      pipeline.del(RedisKeys.BidDetails(parseInt(bidId)));
    }
    pipeline.zremrangebyscore(RedisKeys.BidTime, '-inf', now);
    await pipeline.exec();

    this.logger.log(`⏰ انتهت صلاحية ${expired.length} مزايدة`);
    return expired.length;
  }
}
