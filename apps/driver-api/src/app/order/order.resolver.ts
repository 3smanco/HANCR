import { Resolver, Query, Mutation, Args, Subscription, Int } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { OrderService, NEW_ORDER_AVAILABLE, DRIVER_ORDER_UPDATED } from './order.service';
import { DriverOrderType } from './dto/driver-order.type';
import { JwtAuthGuard, CurrentDriver } from '../auth/jwt-auth.guard';
import { AuthDriver } from '../auth/jwt.strategy';
import { PUB_SUB } from '../pubsub.provider';

@Resolver(() => DriverOrderType)
export class OrderResolver {
  constructor(
    private readonly orderService: OrderService,
    @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
  ) {}

  /** الطلب النشط الحالي */
  @Query(() => DriverOrderType, { nullable: true, description: 'الطلب النشط الحالي' })
  @UseGuards(JwtAuthGuard)
  driverActiveOrder(@CurrentDriver() driver: AuthDriver): Promise<DriverOrderType | null> {
    return this.orderService.getActiveOrder(driver.driverId);
  }

  /** كل الطلبات النشطة (أكثر من واحد عند الرحلة المشتركة Share) */
  @Query(() => [DriverOrderType], { description: 'الطلبات النشطة (Share pool)' })
  @UseGuards(JwtAuthGuard)
  driverActiveOrders(
    @CurrentDriver() driver: AuthDriver,
  ): Promise<DriverOrderType[]> {
    return this.orderService.getActiveOrders(driver.driverId);
  }

  /** الطلبات الواردة المتاحة الآن — تُسحب عند نقر إشعار FCM أو الإقلاع البارد */
  @Query(() => [DriverOrderType], {
    description: 'الطلبات الواردة المتاحة الآن (FCM + Pull)',
  })
  @UseGuards(JwtAuthGuard)
  availableOrders(
    @CurrentDriver() driver: AuthDriver,
  ): Promise<DriverOrderType[]> {
    return this.orderService.getAvailableOrders(driver.driverId);
  }

  /** سجل رحلات السائق المكتملة (الأحدث أولاً) */
  @Query(() => [DriverOrderType], { description: 'سجل رحلات السائق المكتملة' })
  @UseGuards(JwtAuthGuard)
  completedOrders(
    @CurrentDriver() driver: AuthDriver,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<DriverOrderType[]> {
    return this.orderService.getCompletedOrders(driver.driverId, limit, offset);
  }

  /** تقييم السائق للراكب بعد انتهاء الرحلة (1..5) */
  @Mutation(() => DriverOrderType, { description: 'تقييم الراكب بعد الرحلة' })
  @UseGuards(JwtAuthGuard)
  rateRider(
    @CurrentDriver() driver: AuthDriver,
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('stars', { type: () => Int }) stars: number,
  ): Promise<DriverOrderType> {
    return this.orderService.rateRider(driver.driverId, orderId, stars);
  }

  /** قبول طلب جديد */
  @Mutation(() => DriverOrderType, { description: 'قبول طلب رحلة' })
  @UseGuards(JwtAuthGuard)
  acceptOrder(
    @CurrentDriver() driver: AuthDriver,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<DriverOrderType> {
    return this.orderService.acceptOrder(driver.driverId, orderId);
  }

  /** الوصول لنقطة الانطلاق */
  @Mutation(() => DriverOrderType, { description: 'تأكيد وصول نقطة الانطلاق' })
  @UseGuards(JwtAuthGuard)
  arrivedAtPickup(
    @CurrentDriver() driver: AuthDriver,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<DriverOrderType> {
    return this.orderService.arrivedAtPickup(driver.driverId, orderId);
  }

  /** بدء الرحلة */
  @Mutation(() => DriverOrderType, { description: 'بدء الرحلة' })
  @UseGuards(JwtAuthGuard)
  startRide(
    @CurrentDriver() driver: AuthDriver,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<DriverOrderType> {
    return this.orderService.startRide(driver.driverId, orderId);
  }

  /** انتهاء الرحلة */
  @Mutation(() => DriverOrderType, { description: 'انتهاء الرحلة' })
  @UseGuards(JwtAuthGuard)
  finishRide(
    @CurrentDriver() driver: AuthDriver,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<DriverOrderType> {
    return this.orderService.finishRide(driver.driverId, orderId);
  }

  /** تأكيد تسليم أمانة عبر OTP */
  @Mutation(() => DriverOrderType, { description: 'تأكيد تسليم أمانة عبر OTP' })
  @UseGuards(JwtAuthGuard)
  confirmDelivery(
    @CurrentDriver() driver: AuthDriver,
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('otp') otp: string,
  ): Promise<DriverOrderType> {
    return this.orderService.confirmDelivery(driver.driverId, orderId, otp);
  }

  /** إلغاء الطلب */
  @Mutation(() => DriverOrderType, { description: 'إلغاء الطلب' })
  @UseGuards(JwtAuthGuard)
  driverCancelOrder(
    @CurrentDriver() driver: AuthDriver,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<DriverOrderType> {
    return this.orderService.cancelOrder(driver.driverId, orderId);
  }

  /** Subscription — طلبات جديدة للسائق */
  @Subscription(() => DriverOrderType, {
    description: 'طلبات رحلة جديدة متاحة',
    filter(
      payload: { newOrderAvailable: DriverOrderType & { targetDriverIds?: number[] } },
      _vars: unknown,
      context: { req?: { user?: AuthDriver } },
    ) {
      const driverId = context.req?.user?.driverId;
      return (
        typeof driverId === 'number' &&
        Array.isArray(payload.newOrderAvailable.targetDriverIds) &&
        payload.newOrderAvailable.targetDriverIds.includes(driverId)
      );
    },
  })
  @UseGuards(JwtAuthGuard)
  newOrderAvailable(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator(NEW_ORDER_AVAILABLE);
  }

  /** Subscription — تحديثات طلب السائق النشط */
  @Subscription(() => DriverOrderType, {
    description: 'تحديثات الطلب النشط الفورية',
    filter(
      payload: { driverOrderUpdated: DriverOrderType },
      _vars: unknown,
      context: { req?: { user?: AuthDriver } },
    ) {
      return payload.driverOrderUpdated.driverId === context.req?.user?.driverId;
    },
  })
  @UseGuards(JwtAuthGuard)
  driverOrderUpdated(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator(DRIVER_ORDER_UPDATED);
  }
}
