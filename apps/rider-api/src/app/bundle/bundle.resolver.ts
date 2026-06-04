import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BundleService } from './bundle.service';
import {
  PurchaseResultType,
  RideBundleType,
  RiderEntitlementType,
} from './dto/bundle.types';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Resolver(() => RideBundleType)
export class BundleResolver {
  constructor(private readonly service: BundleService) {}

  @Query(() => [RideBundleType], { description: 'الحزم المتاحة في منطقة الراكب' })
  @UseGuards(JwtAuthGuard)
  availableBundles(
    @Args('regionId', { type: () => Int }) regionId: number,
  ): Promise<RideBundleType[]> {
    return this.service.availableBundles(regionId);
  }

  @Query(() => [RiderEntitlementType], { description: 'حِزَم الراكب المُشتراة' })
  @UseGuards(JwtAuthGuard)
  myEntitlements(
    @CurrentUser() user: AuthUser,
  ): Promise<RiderEntitlementType[]> {
    return this.service.myEntitlements(user.riderId);
  }

  @Mutation(() => PurchaseResultType, { description: 'شراء حزمة رحلات' })
  @UseGuards(JwtAuthGuard)
  purchaseBundle(
    @CurrentUser() user: AuthUser,
    @Args('bundleId', { type: () => Int }) bundleId: number,
  ): Promise<PurchaseResultType> {
    return this.service.purchase(user.riderId, bundleId);
  }
}
