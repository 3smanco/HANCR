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
  @Subscription(() => DriverOrderType, { description: 'طلبات رحلة جديدة متاحة' })
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
      context: { req: { user: AuthDriver } },
    ) {
      return true; // السائق يستقبل تحديثات طلباته
    },
  })
  @UseGuards(JwtAuthGuard)
  driverOrderUpdated(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator(DRIVER_ORDER_UPDATED);
  }
}
