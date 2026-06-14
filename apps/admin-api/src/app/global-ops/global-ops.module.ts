import { Module } from '@nestjs/common';
import { GlobalOpsService } from './global-ops.service';
import { GlobalOpsResolver } from './global-ops.resolver';
import { ScopeModule } from '../scope/scope.module';

/**
 * غرفة العمليات (Phase 2) — العرض الكلّي العالمي (Geo-Radar).
 * يجمّع العمليات الحيّة لكل دولة، مُقيَّداً بنطاق المشغّل.
 */
@Module({
  imports: [ScopeModule],
  providers: [GlobalOpsService, GlobalOpsResolver],
  exports: [GlobalOpsService],
})
export class GlobalOpsModule {}
