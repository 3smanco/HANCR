import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverEntity, OrderEntity } from '@hancr/database';
import { HancrRedisModule } from '@hancr/redis';
import { LiveResolver, LiveService } from './live.resolver';
import { ScopeModule } from '../scope/scope.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverEntity, OrderEntity]),
    HancrRedisModule,
    ScopeModule,
  ],
  providers: [LiveService, LiveResolver],
  exports: [LiveService],
})
export class LiveModule {}
