import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverType } from './dto/driver.type';
import { UpdateDriverInput } from './dto/update-driver.input';
import { JwtAuthGuard, CurrentDriver } from '../auth/jwt-auth.guard';
import { AuthDriver } from '../auth/jwt.strategy';

@Resolver(() => DriverType)
export class DriverResolver {
  constructor(private readonly driverService: DriverService) {}

  @Query(() => DriverType, { description: 'بيانات السائق الحالي' })
  @UseGuards(JwtAuthGuard)
  driverMe(@CurrentDriver() driver: AuthDriver): Promise<DriverType> {
    return this.driverService.getMe(driver.driverId);
  }

  @Mutation(() => DriverType, { description: 'تحديث بيانات السائق' })
  @UseGuards(JwtAuthGuard)
  updateDriverProfile(
    @CurrentDriver() driver: AuthDriver,
    @Args('input') input: UpdateDriverInput,
  ): Promise<DriverType> {
    return this.driverService.update(driver.driverId, input);
  }

  /** تحديث FCM token من mobile app */
  @Mutation(() => Boolean, { description: 'تحديث FCM token للسائق' })
  @UseGuards(JwtAuthGuard)
  updateDriverFcmToken(
    @CurrentDriver() driver: AuthDriver,
    @Args('token') token: string,
  ): Promise<boolean> {
    return this.driverService.updateFcmToken(driver.driverId, token);
  }

  /** حذف FCM token عند الخروج */
  @Mutation(() => Boolean, { description: 'حذف FCM token للسائق' })
  @UseGuards(JwtAuthGuard)
  clearDriverFcmToken(@CurrentDriver() driver: AuthDriver): Promise<boolean> {
    return this.driverService.clearFcmToken(driver.driverId);
  }
}
