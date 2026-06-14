import { Module } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CrmResolver } from './crm.resolver';
import { ScopeModule } from '../scope/scope.module';
import { CurrencyModule } from '../currency/currency.module';

/**
 * CRM عالمي (Phase 5) — ملف VIP 360 عبر الدول + كشف الاحتيال عبر-الحدود.
 * مُقيَّد بنطاق المشغّل (allowedRegionIds).
 */
@Module({
  imports: [ScopeModule, CurrencyModule],
  providers: [CrmService, CrmResolver],
  exports: [CrmService],
})
export class CrmModule {}
