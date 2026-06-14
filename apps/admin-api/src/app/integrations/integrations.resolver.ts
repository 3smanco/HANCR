import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';
import { IntegrationsService } from './integrations.service';
import { IntegrationMatrix } from './dto/integration.types';

@Resolver()
export class IntegrationsResolver {
  constructor(
    private readonly integrations: IntegrationsService,
    private readonly scope: ScopeService,
  ) {}

  /** مصفوفة جاهزية التكامل — المزوّد الموصى به لكل قناة/دولة وحالته. super فقط. */
  @Query(() => IntegrationMatrix, {
    description: 'مصفوفة جاهزية التكامل لكل دولة',
  })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('super')
  async integrationMatrix(
    @CurrentAdmin() admin: AdminUser,
  ): Promise<IntegrationMatrix> {
    const allowed = await this.scope.allowedRegionIds({
      adminId: admin.adminId,
      role: admin.role,
    });
    return this.integrations.matrix(allowed);
  }
}
