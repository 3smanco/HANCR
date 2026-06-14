import { Resolver, Query, Args, Int, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';
import { GrowthService } from './growth.service';
import { OfferReachType, OfferSimulationType } from './dto/growth.types';

@Resolver()
export class GrowthResolver {
  constructor(
    private readonly growth: GrowthService,
    private readonly scope: ScopeService,
  ) {}

  /** محاكاة كوبون مُسوَّر جغرافياً على طلب افتراضي. مُقيَّدة بنطاق المشغّل. */
  @Query(() => OfferSimulationType, {
    description: 'محاكاة عرض مُسوَّر جغرافياً',
  })
  @UseGuards(AdminJwtGuard)
  async simulateOffer(
    @CurrentAdmin() admin: AdminUser,
    @Args('code') code: string,
    @Args('regionId', { type: () => Int }) regionId: number,
    @Args('fare', { type: () => Float }) fare: number,
  ): Promise<OfferSimulationType> {
    const allowed = await this.scope.allowedRegionIds({
      adminId: admin.adminId,
      role: admin.role,
    });
    return this.growth.simulateOffer(code, regionId, fare, allowed);
  }

  /** تغطية عرض: كم منطقة/دولة يسري فيها. مُقيَّدة بنطاق المشغّل. */
  @Query(() => OfferReachType, { description: 'تغطية عرض جغرافياً' })
  @UseGuards(AdminJwtGuard)
  async offerReach(
    @CurrentAdmin() admin: AdminUser,
    @Args('code') code: string,
  ): Promise<OfferReachType> {
    const allowed = await this.scope.allowedRegionIds({
      adminId: admin.adminId,
      role: admin.role,
    });
    return this.growth.offerReach(code, allowed);
  }
}
