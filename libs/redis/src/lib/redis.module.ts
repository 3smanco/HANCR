import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@songkeys/nestjs-redis';
import { DriverRedisService } from './driver-redis.service';
import { OrderRedisService } from './order-redis.service';
import { BidRedisService } from './bid-redis.service';
import { CronLockService } from './cron-lock.service';

/**
 * HancrRedisModule — وحدة Redis المشتركة
 * @Global — تتوفر لجميع الوحدات بدون import متكرر
 */
@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: 0,
          // إعادة الاتصال تلقائياً
          retryStrategy: (times: number) => Math.min(times * 100, 3000),
        },
      }),
    }),
  ],
  providers: [
    DriverRedisService,
    OrderRedisService,
    BidRedisService,
    CronLockService,
  ],
  exports: [
    DriverRedisService,
    OrderRedisService,
    BidRedisService,
    CronLockService,
  ],
})
export class HancrRedisModule {}
