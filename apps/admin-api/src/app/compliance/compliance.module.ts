import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceResolver } from './compliance.resolver';
import { ScopeModule } from '../scope/scope.module';

/**
 * امتثال السائقين (Phase 6) — تحقّق وثائق تكيّفي لكل دولة
 * (`CountryEntity.docRequirements`). مُقيَّد بنطاق المشغّل.
 */
@Module({
  imports: [ScopeModule],
  providers: [ComplianceService, ComplianceResolver],
  exports: [ComplianceService],
})
export class ComplianceModule {}
