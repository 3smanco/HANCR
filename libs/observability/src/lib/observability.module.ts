import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';
import { HealthController } from './health.controller';
import { SentryExceptionFilter } from './sentry-exception.filter';
import { HANCR_THROTTLER_CONFIG } from './throttler.config';
import { GqlThrottlerGuard } from './gql-throttler.guard';
import { HancrRedisThrottlerStorage } from './redis-throttler-storage';

/**
 * ObservabilityModule — Health + Sentry + Throttler (with GraphQL support).
 *
 * التخزين على Redis: حدود المعدّل أصبحت عالمية عبر كل عمليات pm2 (كانت
 * في الذاكرة → كل instance يحسب حدّه، فحدّ OTP الفعلي = N×3 وقابل للتجاوز).
 */
@Global()
@Module({
  imports: [
    TerminusModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        throttlers: HANCR_THROTTLER_CONFIG,
        storage: new HancrRedisThrottlerStorage(
          new Redis({
            host: cfg.get<string>('REDIS_HOST', 'localhost'),
            port: cfg.get<number>('REDIS_PORT', 6379),
            password: cfg.get<string>('REDIS_PASSWORD'),
          }),
        ),
      }),
    }),
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: GqlThrottlerGuard }, // ← يدعم GraphQL
    { provide: APP_FILTER, useClass: SentryExceptionFilter },
  ],
})
export class ObservabilityModule {}
