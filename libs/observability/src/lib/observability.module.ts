import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { SentryExceptionFilter } from './sentry-exception.filter';
import { HANCR_THROTTLER_CONFIG } from './throttler.config';

/**
 * ObservabilityModule — يجمع:
 *  - Health endpoints (/health/live, /health/ready)
 *  - Sentry exception filter (يلتقط 5xx فقط)
 *  - Throttler global guard (default 100/60s لكل IP)
 *
 * يُستورَد في root module لكل API.
 */
@Global()
@Module({
  imports: [
    TerminusModule,
    ThrottlerModule.forRoot(HANCR_THROTTLER_CONFIG),
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: SentryExceptionFilter },
  ],
})
export class ObservabilityModule {}
