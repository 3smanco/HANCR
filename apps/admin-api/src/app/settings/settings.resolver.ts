import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import {
  CancelReasonType,
  ReviewParameterType,
  UpsertCancelReasonInput,
  UpsertReviewParameterInput,
} from './dto/settings.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';

@Resolver()
@UseGuards(AdminJwtGuard, AdminRolesGuard)
@RequireRole('ops')
export class SettingsResolver {
  constructor(private readonly service: SettingsService) {}

  // Cancel reasons
  @Query(() => [CancelReasonType], { description: 'أسباب الإلغاء' })
  cancelReasons(): Promise<CancelReasonType[]> {
    return this.service.listReasons();
  }

  @Mutation(() => CancelReasonType, {
    description: 'إنشاء/تحديث سبب إلغاء',
  })
  upsertCancelReason(
    @Args('input') input: UpsertCancelReasonInput,
  ): Promise<CancelReasonType> {
    return this.service.upsertReason(input);
  }

  @Mutation(() => Boolean, { description: 'حذف سبب إلغاء' })
  deleteCancelReason(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.deleteReason(id);
  }

  // Review parameters
  @Query(() => [ReviewParameterType], { description: 'معايير التقييم' })
  reviewParameters(): Promise<ReviewParameterType[]> {
    return this.service.listParameters();
  }

  @Mutation(() => ReviewParameterType, {
    description: 'إنشاء/تحديث معيار تقييم',
  })
  upsertReviewParameter(
    @Args('input') input: UpsertReviewParameterInput,
  ): Promise<ReviewParameterType> {
    return this.service.upsertParameter(input);
  }

  @Mutation(() => Boolean, { description: 'حذف معيار تقييم' })
  deleteReviewParameter(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.service.deleteParameter(id);
  }
}
