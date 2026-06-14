import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsResolver } from './integrations.resolver';
import { ScopeModule } from '../scope/scope.module';

/**
 * موجّه التكامل (Phase 10، الجزء غير المحجوب) — مصفوفة جاهزية المزوّدين لكل
 * دولة/قناة (دفع/رسائل/خرائط) دون كشف مفاتيح. التفعيل الفعلي يحتاج إجراء المالك.
 */
@Module({
  imports: [ScopeModule],
  providers: [IntegrationsService, IntegrationsResolver],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
