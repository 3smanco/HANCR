import { Provider } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import IORedis from 'ioredis';

export const PUB_SUB = 'PUB_SUB';

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
