import { Module } from '@nestjs/common';
import { CrossCityService } from './cross-city.service';
import { CrossCityResolver } from './cross-city.resolver';
import { ScopeModule } from '../scope/scope.module';

/**
 * العمليات عبر-المدن (تحسين Phase 9) — مركز الحجوزات المسبقة القادمة عبر
 * الأسواق، مُثرى بالتوقيت المحلي. مُقيَّد بنطاق المشغّل.
 */
@Module({
  imports: [ScopeModule],
  providers: [CrossCityService, CrossCityResolver],
  exports: [CrossCityService],
})
export class CrossCityModule {}
