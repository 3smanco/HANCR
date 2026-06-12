// CRITICAL: initSentry يجب أن يُستدعى قبل أي import آخر
import { initSentry } from '@hancr/observability';
initSentry('driver-api');

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DriverApiModule } from './app/driver-api.module';

const logger = new Logger('DriverAPI');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    DriverApiModule,
    new FastifyAdapter({ logger: false, trustProxy: true }),
  );

  // إغلاق رشيق عند SIGTERM (نشر/إعادة تشغيل pm2).
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Helmet
  await app.register(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@fastify/helmet'),
    {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    },
  );

  // CORS — whitelist في الإنتاج
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

  const port = config.get<number>('DRIVER_API_PORT') ?? 3001;

  await app.listen(port, '0.0.0.0');

  logger.log(`========================================`);
  logger.log(` HANCR Driver API — ${env.toUpperCase()}`);
  logger.log(` GraphQL: http://0.0.0.0:${port}/graphql`);
  logger.log(` Health:  http://0.0.0.0:${port}/health/ready`);
  logger.log(`========================================`);
}

bootstrap().catch((err: Error) => {
  logger.error(`Failed to start Driver API: ${err.message}`, err.stack);
  process.exit(1);
});
