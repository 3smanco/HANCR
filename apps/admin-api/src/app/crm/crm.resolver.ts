import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';
import { CrmService } from './crm.service';
import { VipProfileType } from './dto/crm.types';

@Resolver()
export class CrmResolver {
  constructor(
    private readonly crm: CrmService,
    private readonly scope: ScopeService,
  ) {}

  /** ملف VIP 360 عالمي لراكب — إنفاق مدمَج + توزيع لكل دولة + إشارات احتيال. مُقيَّد بالنطاق. */
  @Query(() => VipProfileType, { description: 'ملف VIP 360 عالمي لراكب' })
  @UseGuards(AdminJwtGuard)
  async vipProfile(
    @CurrentAdmin() admin: AdminUser,
    @Args('riderId', { type: () => Int }) riderId: number,
  ): Promise<VipProfileType> {
    const allowed = await this.scope.allowedRegionIds({
      adminId: admin.adminId,
      role: admin.role,
    });
    return this.crm.vipProfile(riderId, allowed);
  }
}
