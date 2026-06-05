import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverEntity, OrderEntity } from '@hancr/database';
import { HancrRedisModule } from '@hancr/redis';
import { LiveResolver, LiveService } from './live.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverEntity, OrderEntity]),
    HancrRedisModule,
  ],
  providers: [LiveService, LiveResolver],
  exports: [LiveService],
})
export class LiveModule {}
