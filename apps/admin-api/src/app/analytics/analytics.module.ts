import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity, RiderEntity, DriverEntity } from '@hancr/database';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, RiderEntity, DriverEntity])],
  providers: [AnalyticsService, AnalyticsResolver],
})
export class AnalyticsModule {}
