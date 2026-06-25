import { HancrRedisThrottlerStorage } from '@hancr/observability';

describe('HancrRedisThrottlerStorage', () => {
  it('maps Redis script results to Nest throttler records', async () => {
    const redis = {
      call: jest.fn().mockResolvedValue([3, 59999, 1, 120000]),
      disconnect: jest.fn(),
      options: { keyPrefix: 'test:' },
    };
    const storage = new HancrRedisThrottlerStorage(redis as never, true);

    const record = await storage.increment('request-hash', 60000, 2, 120000, 'strict');

    expect(redis.call).toHaveBeenCalledWith(
      'EVAL',
      expect.stringContaining("redis.call('INCR', hitKey)"),
      2,
      'test:{hancr:throttle:request-hash:strict}:hits',
      'test:{hancr:throttle:request-hash:strict}:blocked',
      60000,
      2,
      120000,
    );
    expect(record).toEqual({
      totalHits: 3,
      timeToExpire: 60,
      isBlocked: true,
      timeToBlockExpire: 120,
    });

    storage.onModuleDestroy();
    expect(redis.disconnect).toHaveBeenCalledWith(false);
  });
});
