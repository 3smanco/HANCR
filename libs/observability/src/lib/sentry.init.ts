import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * تهيئة Sentry لكل APIs الـ HANCR.
 *
 * يجب أن تُستدعى **قبل** أي require/import آخر في `main.ts` لكي تعمل
 * الـ instrumentation بشكل صحيح.
 *
 * @param serviceName اسم الخدمة (rider-api / driver-api / admin-api)
 */
export function initSentry(serviceName: string): void {
  // ابحث عن DSN خاص بالخدمة أولاً، ثم العام كـ fallback
  const serviceDsnKey = `SENTRY_DSN_${serviceName.toUpperCase().replace(/-/g, '_')}`;
  const dsn = process.env[serviceDsnKey] || process.env['SENTRY_DSN'];
  if (!dsn || dsn.startsWith('your_')) {
    // dev mode — تخطَّ بصمت
    console.warn(`[Sentry] SENTRY_DSN not set for ${serviceName} — skipping init`);
    return;
  }

  const env = process.env['NODE_ENV'] ?? 'development';
  const release = process.env['SENTRY_RELEASE'] ?? 'dev';

  Sentry.init({
    dsn,
    environment: env,
    release: `hancr-${serviceName}@${release}`,
    serverName: serviceName,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: env === 'production' ? 0.1 : 1.0,
    profilesSampleRate: env === 'production' ? 0.1 : 1.0,
    // Ignore noise
    ignoreErrors: [
      'NotFoundException',
      'UnauthorizedException',
      'BadRequestException',
    ],
  });

  console.log(
    `[Sentry] Initialized for ${serviceName} (env: ${env}, release: ${release})`,
  );
}

/**
 * أبلغ Sentry بحدث استثنائي مخصَّص.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  Sentry.captureException(error, { extra: context });
}

/**
 * تتبَّع breadcrumb (للسياق قبل الأخطاء).
 */
export function addBreadcrumb(message: string, category?: string): void {
  Sentry.addBreadcrumb({ message, category, level: 'info' });
}
