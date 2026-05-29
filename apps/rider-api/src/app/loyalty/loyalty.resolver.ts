import { Resolver, Query, Mutation, Args, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyType } from './dto/loyalty.type';
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
}
