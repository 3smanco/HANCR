import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyType } from './dto/loyalty.type';
import { RedeemResultType } from './dto/redeem-result.type';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';

@Resolver(() => LoyaltyType)
export class LoyaltyResolver {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  /**
   * بيانات Hancr Miles للراكب الحالي
   */
  @Query(() => LoyaltyType, { description: 'بيانات نقاط Hancr Miles' })
  @UseGuards(JwtAuthGuard)
  myLoyalty(@CurrentUser() user: AuthUser): Promise<LoyaltyType> {
    return this.loyaltyService.getOrCreate(user.riderId);
  }

  /**
   * استبدال نقاط الولاء برصيد محفظة
   */
  @Mutation(() => RedeemResultType, {
    description: 'استبدال Hancr Miles برصيد محفظة',
  })
  @UseGuards(JwtAuthGuard)
  redeemReward(
    @CurrentUser() user: AuthUser,
    @Args('miles', { type: () => Int }) miles: number,
  ): Promise<RedeemResultType> {
    return this.loyaltyService.redeemReward(user.riderId, miles);
  }
}
