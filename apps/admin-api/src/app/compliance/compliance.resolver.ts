import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';
import { ComplianceService } from './compliance.service';
import { DriverComplianceType } from './dto/compliance.types';

@Resolver()
export class ComplianceResolver {
  constructor(
    private readonly compliance: ComplianceService,
    private readonly scope: ScopeService,
  ) {}

  /** امتثال وثائق سائق مقابل متطلّبات دولته. مُقيَّد بنطاق المشغّل. */
  @Query(() => DriverComplianceType, {
    description: 'امتثال وثائق السائق المتكيّف لكل دولة',
  })
  @UseGuards(AdminJwtGuard)
  async driverCompliance(
    @CurrentAdmin() admin: AdminUser,
    @Args('driverId', { type: () => Int }) driverId: number,
  ): Promise<DriverComplianceType> {
    const allowed = await this.scope.allowedRegionIds({
      adminId: admin.adminId,
      role: admin.role,
    });
    return this.compliance.driverCompliance(driverId, allowed);
  }
}
