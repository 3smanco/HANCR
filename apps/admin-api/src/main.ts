// CRITICAL: initSentry يجب أن يُستدعى قبل أي import آخر
import { initSentry } from "@hancr/observability";
initSentry("admin-api");

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { registerLocalUploads } from "@hancr/uploads";
import { AdminApiModule } from "./app/admin-api.module";

const logger = new Logger("AdminAPI");

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AdminApiModule,
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
    require("@fastify/helmet"),
    {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    },
  );

  // CORS — whitelist في الإنتاج (للوحة التحكم الفعلية فقط)
  const config = app.get(ConfigService);
  const env = config.get<string>("NODE_ENV") ?? "development";
  const corsOrigins = config.get<string>("ADMIN_CORS_ORIGINS") ?? "";
  // أمن: fail-closed في الإنتاج — لا origin:true مع credentials.
  const allowedOrigins =
    env === "production"
      ? corsOrigins
        ? corsOrigins.split(",").map((s) => s.trim())
        : [
            "https://admin.hancr.com",
            "https://hancr.com",
            "https://www.hancr.com",
          ]
      : true;

  await app.register(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@fastify/cors"),
    {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
  );

  await registerLocalUploads(app, config);

  const port = config.get<number>("ADMIN_API_PORT") ?? 3002;

  await app.listen(port, "0.0.0.0");

  logger.log(`========================================`);
  logger.log(` HANCR Admin API — ${env.toUpperCase()}`);
  logger.log(` GraphQL: http://0.0.0.0:${port}/graphql`);
  logger.log(` Health:  http://0.0.0.0:${port}/health/ready`);
  logger.log(`========================================`);
}

bootstrap().catch((err: Error) => {
  logger.error(`Failed to start Admin API: ${err.message}`, err.stack);
  process.exit(1);
});
