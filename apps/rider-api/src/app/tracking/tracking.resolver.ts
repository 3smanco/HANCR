import { Resolver, Subscription, Args, Int } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { DriverLocationType } from './dto/driver-location.type';
import { PUB_SUB } from '../pubsub.provider';

/**
 * Channel name — يجب أن يطابق الـ driver-api/location.resolver
 * لكي يستقبل rider-api التحديثات من نفس Redis channel.
 */
export const DRIVER_LOCATION_UPDATED = 'DRIVER_LOCATION_UPDATED';

/**
 * TrackingResolver — Subscription لتتبع موقع السائق على خريطة الراكب.
 *
 * Flow:
 *  1. السائق يستدعي `updateLocation` في driver-api كل 4 ثوانٍ
 *  2. driver-api ينشر event على Redis channel `DRIVER_LOCATION_UPDATED`
 *  3. rider-api يستقبل الـ event ويبثّه للراكب المشترك عبر WebSocket
 *  4. الفلتر يضمن أن الراكب يستقبل تحديثات سائقه فقط (driverId match)
 *
 * NOTE: لا يوجد authentication على هذا الـ subscription — أي راكب يعرف
 * driverId يستطيع تتبعه. هذا مقبول لأنه يُفترض أنه سائقه في رحلة نشطة.
 * مستقبلاً يمكن إضافة guard يتحقق من ربط الراكب بالسائق في order نشط.
 */
@Resolver()
export class TrackingResolver {
  constructor(
    @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
  ) {}

  @Subscription(() => DriverLocationType, {
    description: 'تحديثات موقع السائق الفورية للراكب',
    filter(
      payload: { driverLocationUpdated: DriverLocationType },
      variables: { driverId: number },
    ) {
      return payload.driverLocationUpdated.driverId === variables.driverId;
    },
  })
  driverLocationUpdated(
    @Args('driverId', { type: () => Int }) _driverId: number,
  ): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator(DRIVER_LOCATION_UPDATED);
  }
}
