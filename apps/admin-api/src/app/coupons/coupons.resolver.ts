import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import {
  AdminCouponType,
  CreateCouponInput,
  UpdateCouponInput,
} from './dto/coupon.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Resolver(() => AdminCouponType)
export class CouponsResolver {
  constructor(private readonly couponsService: CouponsService) {}

  @Query(() => [AdminCouponType], { description: 'قائمة الكوبونات' })
  @UseGuards(AdminJwtGuard)
  adminCoupons(): Promise<AdminCouponType[]> {
    return this.couponsService.findAll();
  }

  @Mutation(() => AdminCouponType, { description: 'إنشاء كوبون' })
  @UseGuards(AdminJwtGuard)
  createCoupon(
    @Args('input') input: CreateCouponInput,
  ): Promise<AdminCouponType> {
    return this.couponsService.create(input);
  }

  @Mutation(() => AdminCouponType, { description: 'تحديث كوبون' })
  @UseGuards(AdminJwtGuard)
  updateCoupon(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateCouponInput,
  ): Promise<AdminCouponType> {
    return this.couponsService.update(id, input);
  }

  @Mutation(() => AdminCouponType, { description: 'تفعيل/تعطيل كوبون' })
  @UseGuards(AdminJwtGuard)
  toggleCouponActive(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminCouponType> {
    return this.couponsService.toggleActive(id);
  }

  @Mutation(() => Boolean, { description: 'حذف كوبون' })
  @UseGuards(AdminJwtGuard)
  deleteCoupon(@Args('id', { type: () => Int }) id: number): Promise<boolean> {
    return this.couponsService.remove(id);
  }
}
