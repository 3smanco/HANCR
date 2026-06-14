import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';
import { LoyaltyGlobalService } from './loyalty-global.service';
import { GlobalLoyaltyOverview } from './dto/loyalty-global.types';

@Resolver()
export class LoyaltyGlobalResolver {
  constructor(private readonly loyalty: LoyaltyGlobalService) {}

  /** نظرة عالمية على برنامج Hancr Miles — توزيع المستويات + الالتزام المالي. super فقط. */
  @Query(() => GlobalLoyaltyOverview, {
    description: 'نظرة عالمية على برنامج Hancr Miles',
  })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('super')
  globalLoyaltyOverview(): Promise<GlobalLoyaltyOverview> {
    return this.loyalty.globalOverview();
  }
}
