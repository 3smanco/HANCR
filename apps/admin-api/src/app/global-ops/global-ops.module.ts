import { Module } from '@nestjs/common';
import { GlobalOpsService } from './global-ops.service';
import { GlobalOpsResolver } from './global-ops.resolver';
import { ScopeModule } from '../scope/scope.module';
import { CurrencyModule } from '../currency/currency.module';

/**
 * غرفة العمليات (Phase 2/3) — العرض الكلّي العالمي (Geo-Radar) +
 * مصفوفة الأرباح متعددة العملات. مُقيَّد بنطاق المشغّل.
 */
@Module({
  imports: [ScopeModule, CurrencyModule],
  providers: [GlobalOpsService, GlobalOpsResolver],
  exports: [GlobalOpsService],
})
export class GlobalOpsModule {}
