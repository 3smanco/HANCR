import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';
import { FleetOpsService } from './fleet-ops.service';
import { FleetDocAlerts } from './dto/fleet-ops.types';

@Resolver()
export class FleetOpsResolver {
  constructor(
    private readonly fleetOps: FleetOpsService,
    private readonly scope: ScopeService,
  ) {}

  /** لوحة تنبيهات انتهاء وثائق الأسطول الإقليمية. مُقيَّدة بنطاق المشغّل. */
  @Query(() => FleetDocAlerts, {
    description: 'تنبيهات انتهاء وثائق الأسطول الإقليمية',
  })
  @UseGuards(AdminJwtGuard)
  async fleetDocumentAlerts(
    @CurrentAdmin() admin: AdminUser,
    @Args('withinDays', { type: () => Int, defaultValue: 30 })
    withinDays: number,
  ): Promise<FleetDocAlerts> {
    const allowed = await this.scope.allowedRegionIds({
      adminId: admin.adminId,
      role: admin.role,
    });
    return this.fleetOps.documentExpiryAlerts(withinDays, allowed);
  }
}
