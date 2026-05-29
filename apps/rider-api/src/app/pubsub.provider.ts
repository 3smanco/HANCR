import { Provider } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import IORedis from 'ioredis';

export const PUB_SUB = 'PUB_SUB';

/**
 * Redis PubSub — محرك الـ Subscriptions في GraphQL
 * يستخدم Redis Pub/Sub لنشر الأحداث الفورية:
 * - ORDER_UPDATED: تحديث حالة الطلب
 * - DRIVER_LOCATION: موقع السائق الحالي
 * - BID_OFFER_RECEIVED: عرض جديد في Bid Mode
 */
export const pubSubProvider: Provider = {
  provide: PUB_SUB,
  useFactory: (): RedisPubSub => {
    const redisHost = process.env['REDIS_HOST'] ?? 'localhost';
    const redisPort = parseInt(process.env['REDIS_PORT'] ?? '6379', 10);

    return new RedisPubSub({
      publisher: new IORedis({ host: redisHost, port: redisPort }),
      subscriber: new IORedis({ host: redisHost, port: redisPort }),
    });
  },
};
