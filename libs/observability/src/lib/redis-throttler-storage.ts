import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis, { Cluster } from 'ioredis';

type RedisClient = Redis | Cluster;
type ThrottlerStorageRecord = Awaited<
  ReturnType<ThrottlerStorage['increment']>
>;

@Injectable()
export class HancrRedisThrottlerStorage
  implements ThrottlerStorage, OnModuleDestroy
{
  private readonly script = `
    local hitKey = KEYS[1]
    local blockKey = KEYS[2]
    local ttl = tonumber(ARGV[1])
    local limit = tonumber(ARGV[2])
    local blockDuration = tonumber(ARGV[3])

    local blockTtl = redis.call('PTTL', blockKey)
    if blockTtl > 0 then
      local blockedHits = tonumber(redis.call('GET', hitKey) or limit + 1)
      local hitTtl = redis.call('PTTL', hitKey)
      if hitTtl < 0 then
        hitTtl = 0
      end
      return { blockedHits, hitTtl, 1, blockTtl }
    end

    local totalHits = redis.call('INCR', hitKey)
    local hitTtl = redis.call('PTTL', hitKey)
    if hitTtl < 0 then
      redis.call('PEXPIRE', hitKey, ttl)
      hitTtl = ttl
    end

    if totalHits > limit then
      redis.call('SET', blockKey, 1, 'PX', blockDuration)
      return { totalHits, hitTtl, 1, blockDuration }
    end

    return { totalHits, hitTtl, 0, 0 }
  `
    .replace(/^\s+/gm, '')
    .trim();

  constructor(
    private readonly redis: RedisClient,
    private readonly disconnectOnDestroy = false,
  ) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const scopedKey = this.scopedKey(key, throttlerName);
    const result = await this.redis.call(
      'EVAL',
      this.script,
      2,
      `${scopedKey}:hits`,
      `${scopedKey}:blocked`,
      this.normalizeMilliseconds(ttl),
      Math.max(1, Math.floor(limit)),
      this.normalizeMilliseconds(blockDuration),
    );

    if (!Array.isArray(result) || result.length !== 4) {
      throw new TypeError(`Unexpected Redis throttler result: ${String(result)}`);
    }

    const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] = result.map(
      (value) => Number(value),
    );

    return {
      totalHits,
      timeToExpire: Math.max(0, Math.ceil(timeToExpire / 1000)),
      isBlocked: isBlocked === 1,
      timeToBlockExpire: Math.max(0, Math.ceil(timeToBlockExpire / 1000)),
    };
  }

  onModuleDestroy(): void {
    if (this.disconnectOnDestroy) {
      this.redis.disconnect(false);
    }
  }

  private scopedKey(key: string, throttlerName: string): string {
    const keyPrefix = (this.redis as Redis).options?.keyPrefix ?? '';
    return `${keyPrefix}{hancr:throttle:${key}:${throttlerName}}`;
  }

  private normalizeMilliseconds(value: number): number {
    return Math.max(1, Math.floor(value));
  }
}
