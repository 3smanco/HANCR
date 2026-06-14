import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';
import { IntegrationsService } from './integrations.service';
import { IntegrationChannel } from './dto/integration.types';
import { IntegrationMatrix, ProviderRoute } from './dto/integration.types';

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

  /** قرار توجيه قناة (payment/sms/maps) لمنطقة طلب → المزوّد وحالة جاهزيته. */
  @Query(() => ProviderRoute, {
    description: 'قرار توجيه مزوّد لمنطقة طلب (دفع/رسائل)',
  })
  @UseGuards(AdminJwtGuard)
  providerRoute(
    @Args('regionId', { type: () => Int }) regionId: number,
    @Args('channel') channel: string,
  ): Promise<ProviderRoute> {
    const ch: IntegrationChannel =
      channel === 'sms' || channel === 'maps' ? channel : 'payment';
    return this.integrations.routeForRegion(regionId, ch);
  }
}
