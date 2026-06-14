import { Module } from '@nestjs/common';
import { SosCenterService } from './sos-center.service';
import { SosCenterResolver } from './sos-center.resolver';
import { ScopeModule } from '../scope/scope.module';

/**
 * مركز SOS العالمي (Phase 9) — تجميع الحوادث النشطة عبر النطاق مُثراة بالدولة
 * ورقم الطوارئ السيادي. مُقيَّد بنطاق المشغّل.
 */
@Module({
  imports: [ScopeModule],
  providers: [SosCenterService, SosCenterResolver],
  exports: [SosCenterService],
})
export class SosCenterModule {}
