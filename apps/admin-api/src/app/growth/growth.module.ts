import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponEntity } from '@hancr/database';
import { GrowthService } from './growth.service';
import { GrowthResolver } from './growth.resolver';
import { ScopeModule } from '../scope/scope.module';

/**
 * النمو (Phase 8) — محاكاة العروض المُسوَّرة جغرافياً + تغطيتها.
 * مُقيَّد بنطاق المشغّل.
 */
@Module({
  imports: [TypeOrmModule.forFeature([CouponEntity]), ScopeModule],
  providers: [GrowthService, GrowthResolver],
  exports: [GrowthService],
})
export class GrowthModule {}
