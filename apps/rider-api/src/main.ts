// CRITICAL: initSentry يجب أن يُستدعى قبل أي import آخر
import { initSentry } from '@hancr/observability';
initSentry('rider-api');

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RiderApiModule } from './app/rider-api.module';

const logger = new Logger('RiderAPI');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    RiderApiModule,
    new FastifyAdapter({ logger: false }),
  );

  // =============================================
  // Validation
  // =============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // =============================================
  // Helmet (security headers) — Fastify-compatible
  // =============================================
  await app.register(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@fastify/helmet'),
    {
      contentSecurityPolicy: false, // GraphQL playground يحتاج inline scripts
      crossOriginEmbedderPolicy: false,
    },
  );

  // =============================================
  // CORS — whitelist في الإنتاج
  // =============================================
  const config = app.get(ConfigService);
  const env = config.get<string>('NODE_ENV') ?? 'development';
  const corsOrigins = config.get<string>('CORS_ORIGINS') ?? '';
  const allowedOrigins =
    env === 'production' && corsOrigins
      ? corsOrigins.split(',').map((s) => s.trim())
      : true;

  await app.register(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@fastify/cors'),
    {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  );

  const port = config.get<number>('RIDER_API_PORT') ?? 3000;

  await app.listen(port, '0.0.0.0');

  logger.log(`========================================`);
  logger.log(` HANCR Rider API — ${env.toUpperCase()}`);
  logger.log(` GraphQL: http://0.0.0.0:${port}/graphql`);
  logger.log(` Health:  http://0.0.0.0:${port}/health/ready`);
  logger.log(`========================================`);
}

bootstrap().catch((err: Error) => {
  logger.error(`Failed to start Rider API: ${err.message}`, err.stack);
  process.exit(1);
});
