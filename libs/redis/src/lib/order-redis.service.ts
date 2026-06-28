import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import {
  RedisKeys,
  ORDER_DRIVER_TIMEOUT_SECONDS,
} from './redis-keys.constant';

/** بيانات الطلب في Redis */
export interface OrderRedisData {
  orderId: number;
  lat: number;
  lng: number;
  serviceId: number;
  riderId: number;
  expirySeconds?: number;
}

/**
 * OrderRedisService — إدارة الطلبات في Redis
 * يتتبع الطلبات النشطة ويمنع الإشعارات المكررة
 */
@Injectable()
export class OrderRedisService {
  private readonly logger = new Logger(OrderRedisService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * إضافة طلب جديد لـ Redis
   * يُستدعى فور إنشاء الطلب في قاعدة البيانات
   */
  async addOrder(data: OrderRedisData): Promise<void> {
    const { orderId, lat, lng, expirySeconds = 120 } = data;
    const expiryMs = expirySeconds * 1000;
    const pipeline = this.redis.pipeline();

    // إضافة موقع الطلب
    pipeline.geoadd(RedisKeys.RequestGeo, lng, lat, String(orderId));

    // تعيين وقت الانتهاء
    pipeline.zadd(
      RedisKeys.RequestTime,
      Date.now() + expiryMs,
      String(orderId),
    );

    await pipeline.exec();
    this.logger.debug(`📍 طلب #${orderId} أُضيف لـ Redis`);
  }

  /**
   * تسجيل أن سائقاً أُخطِر بطلب معين
   * يمنع إرسال نفس الإشعار مرتين
   */
  async markDriverNotified(
    orderId: number,
    driverId: number,
  ): Promise<void> {
    const key = RedisKeys.RequestDriversNotified(orderId);
    await this.redis.sadd(key, String(driverId));
    // تنتهي صلاحية الـ SET مع الطلب
    await this.redis.expire(key, 300);
  }

  /**
   * التحقق من أن السائق لم يُخطَر من قبل
   */
  async isDriverNotified(
    orderId: number,
    driverId: number,
  ): Promise<boolean> {
    const key = RedisKeys.RequestDriversNotified(orderId);
    const result = await this.redis.sismember(key, String(driverId));
    return result === 1;
  }

  /**
   * حذف الطلب من Redis عند القبول أو الإلغاء
   */
  async removeOrder(orderId: number): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.zrem(RedisKeys.RequestGeo, String(orderId));
    pipeline.zrem(RedisKeys.RequestTime, String(orderId));
    pipeline.del(RedisKeys.RequestDriversNotified(orderId));
    await pipeline.exec();
    this.logger.debug(`🗑️ طلب #${orderId} حُذف من Redis`);
  }

  /**
   * تنظيف الطلبات المنتهية الصلاحية
   */
  async cleanupExpiredOrders(): Promise<number> {
    const now = Date.now();
    const expired = await this.redis.zrangebyscore(
      RedisKeys.RequestTime,
      '-inf',
      now,
    );

    if (expired.length === 0) return 0;

    const pipeline = this.redis.pipeline();
    for (const orderId of expired) {
      pipeline.zrem(RedisKeys.RequestGeo, orderId);
      pipeline.del(RedisKeys.RequestDriversNotified(parseInt(orderId)));
    }
    pipeline.zremrangebyscore(RedisKeys.RequestTime, '-inf', now);
    await pipeline.exec();

    this.logger.log(`⏰ انتهت صلاحية ${expired.length} طلب`);
    return expired.length;
  }

  /**
   * جلب جميع الطلبات النشطة
   */
  async getActiveOrderIds(): Promise<number[]> {
    const now = Date.now();
    const active = await this.redis.zrangebyscore(
      RedisKeys.RequestTime,
      now,
      '+inf',
    );
    return active.map((id) => parseInt(id));
  }

  /**
   * جلب معرّفات الطلبات المعلّقة القريبة من نقطة (موقع السائق) ضمن نصف قطر.
   * يُستخدَم عند "سحب" الطلب الوارد بعد نقر إشعار FCM أو الإقلاع البارد —
   * حيث يكون الاشتراك الحيّ قد فات الحدث (التطبيق كان مغلقاً وقت الإرسال).
   * يستبعد الطلبات المنتهية صلاحيتها (RequestTime <= now).
   */
  async getNearbyOrderIds(
    lat: number,
    lng: number,
    radiusMeters: number,
    limit = 20,
  ): Promise<number[]> {
    const results = await this.redis.georadius(
      RedisKeys.RequestGeo,
      lng,
      lat,
      radiusMeters,
      'm',
      'ASC',
      'COUNT',
      limit,
    );
    if (!results || results.length === 0) return [];

    const ids = (results as string[]).map((id) => parseInt(id));

    // استبعاد المنتهية صلاحيتها — فقط الطلبات التي وقت انتهائها في المستقبل
    const now = Date.now();
    const live: number[] = [];
    for (const id of ids) {
      const score = await this.redis.zscore(
        RedisKeys.RequestTime,
        String(id),
      );
      if (score != null && parseInt(score) > now) live.push(id);
    }
    return live;
  }
}
