import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';

/**
 * CronLockService — قفل موزّع للوظائف المجدولة.
 *
 * المشكلة: مع pm2 بأكثر من instance، تنطلق نفس وظيفة @Cron في كل عملية،
 * فتُعالَج نفس البيانات N مرة (إشعارات مكرّرة، طلبات تُطابَق مراراً، هدر Maps/SMS).
 *
 * الحل: قبل تنفيذ الوظيفة، نحاول حجز قفل في Redis عبر `SET key NX EX ttl`.
 * عملية واحدة فقط تنجح خلال النافذة الزمنية؛ البقية تتخطّى بصمت.
 */
@Injectable()
export class CronLockService {
  private readonly logger = new Logger(CronLockService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * ينفّذ `fn` فقط إن نجح حجز القفل `name` لمدة `ttlSeconds`.
   * يُرجع true إن نُفّذ، false إن تخطّى (instance آخر يملك القفل).
   *
   * @param name مفتاح فريد للوظيفة (مثل 'cron:bid:cleanup')
   * @param ttlSeconds مدة القفل — اجعلها ≤ فترة التكرار لتفادي الحجب المزدوج
   */
  async run(
    name: string,
    ttlSeconds: number,
    fn: () => Promise<void>,
  ): Promise<boolean> {
    if (!(await this.acquire(name, ttlSeconds))) {
      return false; // instance آخر يملك القفل لهذه النافذة
    }
    try {
      await fn();
      return true;
    } catch (e) {
      this.logger.error(`Cron '${name}' فشلت: ${(e as Error).message}`);
      throw e;
    }
  }

  /**
   * يحاول حجز القفل ويُرجع true/false — للحراسة بسطر واحد أعلى وظيفة @Cron:
   *   if (!(await this.cronLock.acquire('name', ttl))) return;
   */
  async acquire(name: string, ttlSeconds: number): Promise<boolean> {
    const key = `hancr:cronlock:${name}`;
    const acquired = await this.redis.set(key, '1', 'EX', ttlSeconds, 'NX');
    return acquired === 'OK';
  }
}
