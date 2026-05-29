import { Provider } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import IORedis from 'ioredis';

export const PUB_SUB = 'PUB_SUB';

/**
 * Redis PubSub لـ Admin API.
 * يشترك في نفس channels الـ rider-api و driver-api لاستقبال:
 *  - SOS_INCIDENT_CREATED — حادثة طوارئ جديدة
 *  - DRIVER_LOCATION_UPDATED — موقع سائق محدَّث (للـ live map)
 */
export const pubSubProvider: Provider = {
  provide: PUB_SUB,
  useFactory: (): RedisPubSub => {
    const redisHost = process.env['REDIS_HOST'] ?? 'localhost';
    const redisPort = parseInt(process.env['REDIS_PORT'] ?? '6379', 10);
    const password = process.env['REDIS_PASSWORD'];

    return new RedisPubSub({
      publisher: new IORedis({ host: redisHost, port: redisPort, password }),
      subscriber: new IORedis({ host: redisHost, port: redisPort, password }),
    });
  },
};
