import { Resolver, Query, Mutation, Args, Int, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrderDetailService } from './order-detail.service';
import {
  AdminCreateOrderInput,
  AdminNearbyDriverType,
  AdminOrderDetailType,
} from './dto/order-detail.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AdminRolesGuard } from '../auth/admin-roles.guard';
import { RequireRole } from '../auth/roles.decorator';

@ObjectType()
class RiderLookupResult {
  @Field(() => Int) id!: number;
  @Field() name!: string;
  @Field() phone!: string;
}

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

  /** K4 — Dispatcher: create a new order on behalf of a rider. */
  @Mutation(() => AdminOrderDetailType, {
    description: 'إنشاء طلب يدوي من قِبَل المُشغّل (Dispatcher)',
  })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  adminCreateManualOrder(
    @Args('input') input: AdminCreateOrderInput,
  ): Promise<AdminOrderDetailType> {
    return this.service.createManualOrder(input);
  }

  /** K4 — Dispatcher: phone-based rider lookup for the manual order form. */
  @Query(() => [RiderLookupResult], {
    description: 'بحث عن راكب بالهاتف لاستخدامه في إنشاء طلب يدوي',
  })
  @UseGuards(AdminJwtGuard, AdminRolesGuard)
  @RequireRole('ops')
  adminRiderLookup(
    @Args('phone') phone: string,
  ): Promise<RiderLookupResult[]> {
    return this.service.searchRidersByPhone(phone);
  }
}
