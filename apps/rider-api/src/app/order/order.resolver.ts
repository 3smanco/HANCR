import {
  Resolver,
  Query,
  Mutation,
  Args,
  Subscription,
  Int,
  Float,
} from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { OrderService, ORDER_UPDATED } from './order.service';
import { OrderType } from './dto/order.type';
import { CreateOrderInput } from './dto/create-order.input';
import { RateDriverInput } from './dto/rate-driver.input';
import { RoutePreviewInput, RoutePreviewType } from './dto/route-preview.type';
import { CouponPreviewType } from './dto/coupon-preview.type';
import { CouponService } from './coupon.service';
import { MatchingService } from './matching.service';
import { NearbyDriverPin } from './dto/nearby-driver.type';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';
import { PUB_SUB } from '../pubsub.provider';

@Resolver(() => OrderType)
export class OrderResolver {
  constructor(
    private readonly orderService: OrderService,
    private readonly couponService: CouponService,
    private readonly matchingService: MatchingService,
    @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
  ) {}

  /**
   * سائقون قريبون للعرض الحيّ على خريطة الراكب (إحداثيات فقط).
   */
  @Query(() => [NearbyDriverPin], { description: 'سائقون قريبون (للخريطة)' })
  @UseGuards(JwtAuthGuard)
  async nearbyDrivers(
    @Args('lat', { type: () => Float }) lat: number,
    @Args('lng', { type: () => Float }) lng: number,
  ): Promise<NearbyDriverPin[]> {
    const pins = await this.matchingService.nearbyDriverPins(lat, lng);
    return pins.map((p) => ({ lat: p.lat, lng: p.lng, heading: p.heading }));
  }

  /**
   * معاينة كوبون الخصم قبل الطلب
   */
  @Query(() => CouponPreviewType, { description: 'التحقق من كود الخصم وحساب الخصم' })
  @UseGuards(JwtAuthGuard)
  async validateCoupon(
    @CurrentUser() user: AuthUser,
    @Args('code') code: string,
    @Args('fare', { type: () => Int }) fare: number,
    @Args('regionId', { type: () => Int }) regionId: number,
  ): Promise<CouponPreviewType> {
    const r = await this.couponService.validate(code, fare, regionId, user.riderId);
    return {
      code: r.coupon.code,
      discountAmount: r.discountAmount,
      costAfterCoupon: r.costAfterCoupon,
    };
  }

  /**
   * معاينة المسار — مسافة الطريق الفعلية والأجرة التقديرية قبل الطلب
   */
  @Query(() => RoutePreviewType, { description: 'معاينة المسافة والأجرة بالطريق' })
  @UseGuards(JwtAuthGuard)
  routePreview(
    @CurrentUser() user: AuthUser,
    @Args('input') input: RoutePreviewInput,
  ): Promise<RoutePreviewType> {
    return this.orderService.previewRoute(
      user.riderId,
      { lat: input.origin.lat, lng: input.origin.lng },
      { lat: input.destination.lat, lng: input.destination.lng },
      input.serviceId,
    );
  }

  /**
   * إنشاء طلب رحلة جديد
   */
  @Mutation(() => OrderType, { description: 'طلب رحلة جديدة' })
  @UseGuards(JwtAuthGuard)
  createOrder(
    @CurrentUser() user: AuthUser,
    @Args('input') input: CreateOrderInput,
  ): Promise<OrderType> {
    return this.orderService.createOrder(user.riderId, input);
  }

  /**
   * إلغاء الطلب الحالي
   */
  @Mutation(() => OrderType, { description: 'إلغاء الطلب' })
  @UseGuards(JwtAuthGuard)
  cancelOrder(
    @CurrentUser() user: AuthUser,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<OrderType> {
    return this.orderService.cancelOrder(user.riderId, orderId);
  }

  /**
   * التحقق من OTP التسليم الآمن
   */
  @Mutation(() => OrderType, { description: 'التحقق من OTP للتسليم الآمن' })
  @UseGuards(JwtAuthGuard)
  verifyDeliveryOtp(
    @CurrentUser() user: AuthUser,
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('otp') otp: string,
  ): Promise<OrderType> {
    return this.orderService.verifyDeliveryOtp(user.riderId, orderId, otp);
  }

  /**
   * تقييم السائق بعد انتهاء الرحلة
   */
  @Mutation(() => OrderType, { description: 'تقييم السائق' })
  @UseGuards(JwtAuthGuard)
  rateDriver(
    @CurrentUser() user: AuthUser,
    @Args('input') input: RateDriverInput,
  ): Promise<OrderType> {
    return this.orderService.rateDriver(user.riderId, input);
  }

  /**
   * الطلب النشط الحالي
   */
  @Query(() => OrderType, { nullable: true, description: 'الطلب النشط الحالي' })
  @UseGuards(JwtAuthGuard)
  activeOrder(@CurrentUser() user: AuthUser): Promise<OrderType | null> {
    return this.orderService.getActiveOrder(user.riderId);
  }

  /**
   * سجل الرحلات السابقة
   */
  @Query(() => [OrderType], { description: 'سجل الرحلات' })
  @UseGuards(JwtAuthGuard)
  orderHistory(
    @CurrentUser() user: AuthUser,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<OrderType[]> {
    return this.orderService.getOrderHistory(user.riderId, limit, offset);
  }

  /**
   * الرحلات المجدولة القادمة (status=Booked) — تبويب "القادمة" في النشاط.
   */
  @Query(() => [OrderType], { description: 'الرحلات المجدولة القادمة' })
  @UseGuards(JwtAuthGuard)
  upcomingOrders(@CurrentUser() user: AuthUser): Promise<OrderType[]> {
    return this.orderService.getUpcomingOrders(user.riderId);
  }

  /**
   * Subscription — تحديثات الطلب الفورية
   * يستقبل الراكب تحديثات حالة طلبه لحظةً بلحظة
   *
   * subscription {
   *   orderUpdated {
   *     id status driverName driverPhone etaPickup
   *   }
   * }
   */
  @Subscription(() => OrderType, {
    description: 'تحديثات الطلب الفورية عبر WebSocket',
    filter(
      payload: { orderUpdated: OrderType },
      _variables: unknown,
      context: { req: { user: AuthUser } },
    ) {
      // فلترة: الراكب يستقبل تحديثات طلباته فقط
      return payload.orderUpdated.riderId === context.req.user.riderId;
    },
  })
  @UseGuards(JwtAuthGuard)
  orderUpdated(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator(ORDER_UPDATED);
  }
}
