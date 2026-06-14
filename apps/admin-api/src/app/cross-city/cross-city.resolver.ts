import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';
import { CrossCityService } from './cross-city.service';
import { CrossCityOps } from './dto/cross-city.types';

@Resolver()
export class CrossCityResolver {
  constructor(
    private readonly crossCity: CrossCityService,
    private readonly scope: ScopeService,
  ) {}

  /** مركز العمليات عبر-المدن — الحجوزات المسبقة القادمة عبر النطاق. مُقيَّد بالنطاق. */
  @Query(() => CrossCityOps, {
    description: 'الحجوزات المسبقة القادمة عبر-المدن',
  })
  @UseGuards(AdminJwtGuard)
  async crossCityOps(
    @CurrentAdmin() admin: AdminUser,
    @Args('horizonDays', { type: () => Int, defaultValue: 14 })
    horizonDays: number,
  ): Promise<CrossCityOps> {
    const allowed = await this.scope.allowedRegionIds({
      adminId: admin.adminId,
      role: admin.role,
    });
    return this.crossCity.upcomingBookings(allowed, horizonDays);
  }
}
