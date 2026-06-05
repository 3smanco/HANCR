import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrderDetailService } from './order-detail.service';
import {
  AdminNearbyDriverType,
  AdminOrderDetailType,
} from './dto/order-detail.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';

@Resolver(() => AdminOrderDetailType)
export class OrderDetailResolver {
  constructor(private readonly service: OrderDetailService) {}

  @Query(() => AdminOrderDetailType, {
    description: 'تفاصيل الطلب مع timeline و chat',
  })
  @UseGuards(AdminJwtGuard)
  adminOrderDetail(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<AdminOrderDetailType> {
    return this.service.getDetail(id);
  }

  @Query(() => [AdminNearbyDriverType], {
    description: 'مرشّحون من السائقين القريبين للتعيين اليدوي',
  })
  @UseGuards(AdminJwtGuard)
  adminOrderCandidates(
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<AdminNearbyDriverType[]> {
    return this.service.findCandidates(orderId);
  }

  @Mutation(() => AdminOrderDetailType, {
    description: 'تعيين سائق محدد قسراً (Admin override)',
  })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  adminAssignDriver(
    @Args('orderId', { type: () => Int }) orderId: number,
    @Args('driverId', { type: () => Int }) driverId: number,
  ): Promise<AdminOrderDetailType> {
    return this.service.assignDriver(orderId, driverId);
  }
}
