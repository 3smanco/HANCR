import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AdminOrderType, OrderListResult } from './dto/admin-order.type';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Resolver(() => AdminOrderType)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => OrderListResult, { description: 'قائمة الطلبات' })
  @UseGuards(AdminJwtGuard)
  adminOrders(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @Args('status', { nullable: true }) status?: string,
    @Args('riderId', { type: () => Int, nullable: true }) riderId?: number,
    @Args('driverId', { type: () => Int, nullable: true }) driverId?: number,
  ): Promise<OrderListResult> {
    return this.ordersService.listOrders(page, limit, status, riderId, driverId);
  }

  @Query(() => AdminOrderType, { description: 'طلب بالمعرّف' })
  @UseGuards(AdminJwtGuard)
  adminOrder(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminOrderType> {
    return this.ordersService.getOrder(id);
  }

  @Mutation(() => AdminOrderType, { description: 'إلغاء طلب قسراً' })
  @UseGuards(AdminJwtGuard)
  forceCancel(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminOrderType> {
    return this.ordersService.forceCancel(id);
  }
}
