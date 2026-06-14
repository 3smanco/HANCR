import { Module } from '@nestjs/common';
import { FleetOpsService } from './fleet-ops.service';
import { FleetOpsResolver } from './fleet-ops.resolver';
import { ScopeModule } from '../scope/scope.module';

/**
 * عمليات الأسطول (Phase 7) — لوحة تنبيهات انتهاء وثائق الأسطول الإقليمية.
 * مُقيَّدة بنطاق المشغّل.
 */
@Module({
  imports: [ScopeModule],
  providers: [FleetOpsService, FleetOpsResolver],
  exports: [FleetOpsService],
})
export class FleetOpsModule {}
