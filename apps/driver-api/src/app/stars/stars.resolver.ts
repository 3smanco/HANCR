import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { StarsService } from './stars.service';
import { StarsType } from './dto/stars.type';
import { JwtAuthGuard, CurrentDriver } from '../auth/jwt-auth.guard';
import { AuthDriver } from '../auth/jwt.strategy';

@Resolver(() => StarsType)
export class StarsResolver {
  constructor(private readonly starsService: StarsService) {}

  /**
   * نجوم السائق وعمولته الحالية
   */
  @Query(() => StarsType, { description: 'نجوم Captain Stars ونسبة العمولة' })
  @UseGuards(JwtAuthGuard)
  myStars(@CurrentDriver() driver: AuthDriver): Promise<StarsType> {
    return this.starsService.getOrCreate(driver.driverId);
  }
}
