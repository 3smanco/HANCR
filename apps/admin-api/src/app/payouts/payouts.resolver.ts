import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import {
  CreatePayoutSessionInput,
  EligibleDriverType,
  PayoutSessionDetailType,
  PayoutSessionType,
} from './dto/payout.types';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';
import { AdminUser } from '../auth/admin-jwt.strategy';

@Resolver(() => PayoutSessionType)
@UseGuards(AdminJwtGuard, AdminRolesGuard)
@RequireRole('finance')
export class PayoutsResolver {
  constructor(private readonly service: PayoutsService) {}

  @Query(() => [EligibleDriverType], {
    description: 'سائقون مؤهَّلون للسحب (رصيد + طريقة افتراضية)',
  })
  eligibleDrivers(): Promise<EligibleDriverType[]> {
    return this.service.listEligible();
  }

  @Query(() => [PayoutSessionType], { description: 'قائمة جلسات الدفع' })
  payoutSessions(): Promise<PayoutSessionType[]> {
    return this.service.listSessions();
  }

  @Query(() => PayoutSessionDetailType, { description: 'تفاصيل جلسة دفع' })
  payoutSession(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<PayoutSessionDetailType> {
    return this.service.getDetail(id);
  }

  @Mutation(() => PayoutSessionDetailType, {
    description: 'إنشاء جلسة دفع (draft)',
  })
  createPayoutSession(
    @Args('input') input: CreatePayoutSessionInput,
    @CurrentAdmin() admin: AdminUser,
  ): Promise<PayoutSessionDetailType> {
    return this.service.create(input, admin.adminId);
  }

  @Mutation(() => PayoutSessionDetailType, {
    description: 'تنفيذ جلسة دفع (يخصم من محافظ السائقين)',
  })
  processPayoutSession(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<PayoutSessionDetailType> {
    return this.service.process(id);
  }
}
