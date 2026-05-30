import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { SentryExceptionFilter } from './sentry-exception.filter';
import { HANCR_THROTTLER_CONFIG } from './throttler.config';
import { GqlThrottlerGuard } from './gql-throttler.guard';

/**
 * ObservabilityModule — Health + Sentry + Throttler (with GraphQL support).
 */
@Global()
@Module({
  imports: [
    TerminusModule,
    ThrottlerModule.forRoot(HANCR_THROTTLER_CONFIG),
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: GqlThrottlerGuard }, // ← يدعم GraphQL
    { provide: APP_FILTER, useClass: SentryExceptionFilter },
  ],
})
export class ObservabilityModule {}
