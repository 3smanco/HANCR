import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LoyaltyAdminService } from './loyalty-admin.service';
import {
  AdjustLoyaltyInput,
  AdminLoyaltyType,
} from './dto/loyalty-admin.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';
import { CurrentAdmin } from '../auth/current-admin.decorator';
import type { AdminUser } from '../auth/admin-jwt.strategy';

@Resolver(() => AdminLoyaltyType)
export class LoyaltyAdminResolver {
  constructor(private readonly service: LoyaltyAdminService) {}

  @Query(() => AdminLoyaltyType, { description: 'بيانات الولاء لراكب' })
  @UseGuards(AdminJwtGuard)
  adminRiderLoyalty(
    @Args('riderId', { type: () => Int }) riderId: number,
  ): Promise<AdminLoyaltyType> {
    return this.service.getForRider(riderId);
  }

  @Mutation(() => AdminLoyaltyType, {
    description: 'تعديل نقاط راكب يدوياً (موجب=إضافة، سالب=خصم)',
  })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('finance', 'support')
  adminAdjustRiderLoyalty(
    @Args('input') input: AdjustLoyaltyInput,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<AdminLoyaltyType> {
    return this.service.adjust(input, admin.adminId);
  }
}
