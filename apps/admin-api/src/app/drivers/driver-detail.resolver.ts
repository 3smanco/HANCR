import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DriverDetailService } from './driver-detail.service';
import {
  AdminDriverDetailType,
  AdminDriverDocumentType,
  ReviewDocumentInput,
  SetDriverStatusInput,
} from './dto/driver-detail.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';
import { CurrentAdmin } from '../auth/current-admin.decorator';
import type { AdminUser } from '../auth/admin-jwt.strategy';

@Resolver(() => AdminDriverDetailType)
export class DriverDetailResolver {
  constructor(private readonly service: DriverDetailService) {}

  @Query(() => AdminDriverDetailType, {
    description: 'تفاصيل سائق (Documents/Orders/Transactions/Reviews)',
  })
  @UseGuards(AdminJwtGuard)
  adminDriverDetail(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminDriverDetailType> {
    return this.service.getDetail(id);
  }

  @Mutation(() => AdminDriverDetailType, {
    description: 'تعيين حالة اعتماد السائق',
  })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  setDriverStatus(
    @Args('input') input: SetDriverStatusInput,
  ): Promise<AdminDriverDetailType> {
    return this.service.setStatus(input);
  }

  @Mutation(() => AdminDriverDocumentType, {
    description: 'مراجعة وثيقة سائق (موافقة/رفض)',
  })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  reviewDriverDocument(
    @Args('input') input: ReviewDocumentInput,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<AdminDriverDocumentType> {
    return this.service.reviewDocument(input, admin.adminId);
  }
}
