import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import {
  RedisKeys,
  DRIVER_STALE_THRESHOLD_SECONDS,
} from './redis-keys.constant';

/** بيانات موقع السائق المُرسَلة كل 4 ثوانٍ */
export interface DriverLocationUpdate {
  driverId: number;
  lat: number;
  lng: number;
  heading: number;
  /** الخدمات التي يقدمها السائق */
  serviceIds: number[];
}

/** معلومات السائق القريب */
export interface NearbyDriver {
  driverId: number;
  distanceMeters: number;
  lat: number;
  lng: number;
  heading: number;
}

/**
 * DriverRedisService — إدارة حالة السائقين في Redis
 * يُحدَّث كل 4 ثوانٍ لكل سائق متصل
 * يُستخدَم من محرك المطابقة للعثور على أقرب السائقين
 */
@Injectable()
export class DriverRedisService {
  private readonly logger = new Logger(DriverRedisService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * تحديث موقع السائق — يُستدعى كل 4 ثوانٍ
   */
  async updateLocation(update: DriverLocationUpdate): Promise<void> {
    const { driverId, lat, lng, heading, serviceIds } = update;
    const pipeline = this.redis.pipeline();

    // تحديث الموقع الجغرافي في GEO SET
    pipeline.geoadd(RedisKeys.DriverGeo, lng, lat, String(driverId));

    // تحديث الاتجاه
    pipeline.hset(RedisKeys.DriverHeading, String(driverId), String(heading));

    // تحديث وقت آخر نشاط
    pipeline.zadd(RedisKeys.DriverTimestamp, Date.now(), String(driverId));

    // تحديث الخدمات
    pipeline.hset(
      RedisKeys.DriverServices,
      String(driverId),
      JSON.stringify(serviceIds),
    );

    await pipeline.exec();
  }

  /**
   * تعيين حالة السائق (online/busy/offline)
   */
  async setStatus(
    driverId: number,
    status: 'Online' | 'Busy' | 'Offline',
  ): Promise<void> {
    await this.redis.hset(
      RedisKeys.DriverStatus,
      String(driverId),
      status,
    );

    // عند الـ offline، حذف من GEO SET
    if (status === 'Offline') {
      await this.redis.zrem(RedisKeys.DriverGeo, String(driverId));
    }
  }

  /**
   * البحث عن السائقين القريبين من نقطة معينة
   * يُستخدَم من محرك المطابقة
   */
  async findNearbyDrivers(
    lat: number,
    lng: number,
    radiusMeters: number,
    serviceId: number,
    limit = 10,
  ): Promise<NearbyDriver[]> {
    // GEORADIUS — يعيد السائقين مرتبين بالمسافة
    const results = await this.redis.georadius(
      RedisKeys.DriverGeo,
      lng,
      lat,
      radiusMeters,
      'm',
      'WITHCOORD',
      'WITHDIST',
      'ASC',
      'COUNT',
      limit * 3, // نأخذ أكثر للفلترة
    );

    if (!results || results.length === 0) return [];

    // جلب حالات وخدمات السائقين دفعة واحدة
    const driverIds = (results as Array<[string, string, [string, string]]>)
      .map(([id]) => id);

    const [statuses, services] = await Promise.all([
      this.redis.hmget(RedisKeys.DriverStatus, ...driverIds),
      this.redis.hmget(RedisKeys.DriverServices, ...driverIds),
    ]);

    const staleThreshold = Date.now() - DRIVER_STALE_THRESHOLD_SECONDS * 1000;
    const nearby: NearbyDriver[] = [];

    for (let i = 0; i < (results as Array<[string, string, [string, string]]>).length; i++) {
      const [driverIdStr, distStr, coords] = (
        results as Array<[string, string, [string, string]]>
      )[i];

      const status = statuses[i];
      const servicesStr = services[i];

      // فلترة: يجب أن يكون Online
      if (status !== 'Online') continue;

      // فلترة: يجب أن يقدم الخدمة المطلوبة
      if (servicesStr) {
        const driverServices: number[] = JSON.parse(servicesStr);
        if (!driverServices.includes(serviceId)) continue;
      }

      nearby.push({
        driverId: parseInt(driverIdStr),
        distanceMeters: Math.round(parseFloat(distStr)),
        lat: parseFloat(coords[1]),
        lng: parseFloat(coords[0]),
        heading: 0, // نجلبه لاحقاً إذا احتجنا
      });

      if (nearby.length >= limit) break;
    }

    return nearby;
  }

  /**
   * جلب موقع سائق واحد
   */
  async getDriverLocation(
    driverId: number,
  ): Promise<{ lat: number; lng: number; heading: number } | null> {
    const [pos, heading] = await Promise.all([
      this.redis.geopos(RedisKeys.DriverGeo, String(driverId)),
      this.redis.hget(RedisKeys.DriverHeading, String(driverId)),
    ]);

    if (!pos || !pos[0]) return null;

    return {
      lng: parseFloat(pos[0][0]),
      lat: parseFloat(pos[0][1]),
      heading: heading ? parseInt(heading) : 0,
    };
  }

  /**
   * تنظيف السائقين غير النشطين (يُشغَّل كل دقيقة)
   */
  async cleanupStaleDrivers(): Promise<number> {
    const staleThreshold = Date.now() - DRIVER_STALE_THRESHOLD_SECONDS * 1000;
    const staleDrivers = await this.redis.zrangebyscore(
      RedisKeys.DriverTimestamp,
      '-inf',
      staleThreshold,
    );

    if (staleDrivers.length === 0) return 0;

    const pipeline = this.redis.pipeline();
    for (const driverId of staleDrivers) {
      pipeline.zrem(RedisKeys.DriverGeo, driverId);
      pipeline.hset(RedisKeys.DriverStatus, driverId, 'Offline');
    }
    pipeline.zremrangebyscore(
      RedisKeys.DriverTimestamp,
      '-inf',
      staleThreshold,
    );
    await pipeline.exec();

    this.logger.log(`🧹 تنظيف ${staleDrivers.length} سائق غير نشط`);
    return staleDrivers.length;
  }

  /**
   * عدد السائقين المتاحين في منطقة ما
   */
  async countOnlineDriversInRadius(
    lat: number,
    lng: number,
    radiusMeters: number,
  ): Promise<number> {
    const results = await this.redis.georadius(
      RedisKeys.DriverGeo,
      lng,
      lat,
      radiusMeters,
      'm',
    );
    return results ? results.length : 0;
  }
}
