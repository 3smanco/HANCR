import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';
import { GlobalOpsService } from './global-ops.service';
import { GlobalLiveOverview } from './dto/global-ops.types';

@Resolver()
export class GlobalOpsResolver {
  constructor(
    private readonly ops: GlobalOpsService,
    private readonly scope: ScopeService,
  ) {}

  /** العرض الكلّي العالمي — عمليات حيّة لكل دولة (مُقيَّد بنطاق المشغّل). */
  @Query(() => GlobalLiveOverview, {
    description: 'العمليات الحيّة لكل دولة (Geo-Radar)',
  })
  @UseGuards(AdminJwtGuard)
  async globalLiveOverview(
    @CurrentAdmin() admin: AdminUser,
  ): Promise<GlobalLiveOverview> {
    const allowed = await this.scope.allowedRegionIds({
      adminId: admin.adminId,
      role: admin.role,
    });
    return this.ops.globalLiveOverview(allowed);
  }
}
