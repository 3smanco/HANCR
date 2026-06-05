import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingZoneEntity } from '@hancr/database';
import {
  PricingZonesResolver,
  PricingZonesService,
} from './pricing-zones.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([PricingZoneEntity])],
  providers: [PricingZonesService, PricingZonesResolver],
  exports: [PricingZonesService],
})
export class PricingZonesModule {}
