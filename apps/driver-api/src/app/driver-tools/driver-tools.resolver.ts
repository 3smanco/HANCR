import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DriverToolsService } from './driver-tools.service';
import { DailyEarningType, DemandZoneType } from './driver-tools.types';
import { JwtAuthGuard, CurrentDriver } from '../auth/jwt-auth.guard';
import { AuthDriver } from '../auth/jwt.strategy';

@Resolver()
export class DriverToolsResolver {
  constructor(private readonly service: DriverToolsService) {}

  @Query(() => [DailyEarningType], {
    description: 'أرباح السائق اليومية لآخر days يوماً',
  })
  @UseGuards(JwtAuthGuard)
  myDailyEarnings(
    @CurrentDriver() driver: AuthDriver,
    @Args('days', { type: () => Int, defaultValue: 7 }) days: number,
  ): Promise<DailyEarningType[]> {
    return this.service.dailyEarnings(driver.driverId, days);
  }

  @Query(() => [DemandZoneType], {
    description: 'مناطق الطلب الساخنة (heatmap) من الرحلات الأخيرة',
  })
  @UseGuards(JwtAuthGuard)
  demandZones(): Promise<DemandZoneType[]> {
    return this.service.demandZones();
  }
}
