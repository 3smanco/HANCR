import { Resolver, Mutation, Query, Args, Subscription, Int } from '@nestjs/graphql';
import { ForbiddenException, UseGuards, Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { LocationService } from './location.service';
import { DriverLocationType } from './dto/driver-location.type';
import { UpdateLocationInput } from './dto/update-location.input';
import { JwtAuthGuard, CurrentDriver } from '../auth/jwt-auth.guard';
import { AuthDriver } from '../auth/jwt.strategy';
import { PUB_SUB } from '../pubsub.provider';

export const DRIVER_LOCATION_UPDATED = 'DRIVER_LOCATION_UPDATED';

@Resolver(() => DriverLocationType)
export class LocationResolver {
  constructor(
    private readonly locationService: LocationService,
    @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
  ) {}

  /**
   * تحديث الموقع — يُرسَل من التطبيق كل 4 ثوانٍ
   *
   * mutation {
   *   updateLocation(input: { lat: 25.285, lng: 51.531, heading: 90 }) {
   *     driverId lat lng heading updatedAt
   *   }
   * }
   */
  @Mutation(() => DriverLocationType, { description: 'تحديث موقع السائق (كل 4 ثوانٍ)' })
  @UseGuards(JwtAuthGuard)
  async updateLocation(
    @CurrentDriver() driver: AuthDriver,
    @Args('input') input: UpdateLocationInput,
  ): Promise<DriverLocationType> {
    const result = await this.locationService.updateLocation(driver.driverId, input);

    // نشر الموقع عبر Subscription لتحديث الراكب
    await this.pubSub.publish(DRIVER_LOCATION_UPDATED, {
      driverLocationUpdated: result,
    });

    return result;
  }

  /**
   * السائق يضغط "أنا متصل الآن" في التطبيق
   */
  @Mutation(() => Boolean, { description: 'تحويل حالة السائق إلى Online' })
  @UseGuards(JwtAuthGuard)
  goOnline(@CurrentDriver() driver: AuthDriver): Promise<boolean> {
    return this.locationService.goOnline(driver.driverId);
  }

  /**
   * السائق يضغط "أنا غير متصل"
   */
  @Mutation(() => Boolean, { description: 'تحويل حالة السائق إلى Offline' })
  @UseGuards(JwtAuthGuard)
  goOffline(@CurrentDriver() driver: AuthDriver): Promise<boolean> {
    return this.locationService.goOffline(driver.driverId);
  }

  /**
   * جلب الموقع الحالي
   */
  @Query(() => DriverLocationType, { nullable: true, description: 'الموقع الحالي للسائق' })
  @UseGuards(JwtAuthGuard)
  myLocation(@CurrentDriver() driver: AuthDriver): Promise<DriverLocationType | null> {
    return this.locationService.getLocation(driver.driverId);
  }

  /**
   * Subscription — تتبع موقع سائق بعينه (للراكب)
   * يستخدمه الراكب لتتبع السائق على الخريطة
   */
  @Subscription(() => DriverLocationType, {
    description: 'تحديثات موقع السائق الفورية للراكب',
    filter(
      payload: { driverLocationUpdated: DriverLocationType },
      variables: { driverId: number },
    ) {
      return payload.driverLocationUpdated.driverId === variables.driverId;
    },
  })
  @UseGuards(JwtAuthGuard)
  driverLocationUpdated(
    @CurrentDriver() driver: AuthDriver,
    @Args('driverId', { type: () => Int }) driverId: number,
  ): AsyncIterator<unknown> {
    if (driver.driverId !== driverId) {
      throw new ForbiddenException('Tracking is not allowed for this driver');
    }
    return this.pubSub.asyncIterator(DRIVER_LOCATION_UPDATED);
  }
}
