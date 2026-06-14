import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';
import { CompanyGlobalService } from './company-global.service';
import { CompanyGlobalProfile } from './dto/company-global.types';

@Resolver()
export class CompanyGlobalResolver {
  constructor(
    private readonly companies: CompanyGlobalService,
    private readonly scope: ScopeService,
  ) {}

  /** ملف شركة عالمي (MNC) — إنفاق الفروع عبر الدول. مُقيَّد بنطاق المشغّل. */
  @Query(() => CompanyGlobalProfile, {
    description: 'ملف شركة عالمي (MNC) — إنفاق عبر الدول',
  })
  @UseGuards(AdminJwtGuard)
  async companyGlobalProfile(
    @CurrentAdmin() admin: AdminUser,
    @Args('companyId', { type: () => Int }) companyId: number,
  ): Promise<CompanyGlobalProfile> {
    const allowed = await this.scope.allowedRegionIds({
      adminId: admin.adminId,
      role: admin.role,
    });
    return this.companies.companyGlobalProfile(companyId, allowed);
  }
}
