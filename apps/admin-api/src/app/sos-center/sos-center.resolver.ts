import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';
import { SosCenterService } from './sos-center.service';
import { GlobalSosCenter } from './dto/sos-center.types';

@Resolver()
export class SosCenterResolver {
  constructor(
    private readonly sosCenter: SosCenterService,
    private readonly scope: ScopeService,
  ) {}

  /** مركز SOS العالمي — حوادث نشطة مُثراة بالدولة ورقم الطوارئ السيادي. مُقيَّد بالنطاق. */
  @Query(() => GlobalSosCenter, { description: 'مركز SOS العالمي' })
  @UseGuards(AdminJwtGuard)
  async globalSosCenter(
    @CurrentAdmin() admin: AdminUser,
  ): Promise<GlobalSosCenter> {
    const allowed = await this.scope.allowedRegionIds({
      adminId: admin.adminId,
      role: admin.role,
    });
    return this.sosCenter.globalSosCenter(allowed);
  }
}
