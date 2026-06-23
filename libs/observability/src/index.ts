// =============================================
// @hancr/observability — Sentry + Health + Throttling
// =============================================

export { ObservabilityModule } from './lib/observability.module';
export {
  initSentry,
  captureException,
  addBreadcrumb,
} from './lib/sentry.init';
export { SentryExceptionFilter } from './lib/sentry-exception.filter';
export { HealthController } from './lib/health.controller';
export { HANCR_THROTTLER_CONFIG } from './lib/throttler.config';
export { GqlThrottlerGuard } from './lib/gql-throttler.guard';
export { buildGraphqlContext } from './lib/graphql-context';
export type {
  GraphqlContextSource,
  HancrGraphqlContext,
} from './lib/graphql-context';
export { maskEmail, maskPhoneNumber } from './lib/redaction';
