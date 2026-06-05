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
  ): Promise<AdminDriverDocumentType> {
    // TODO: reviewer id should come from admin JWT; using 0 placeholder for now
    return this.service.reviewDocument(input, 0);
  }
}
