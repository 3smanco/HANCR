import { ForbiddenException, Inject, UseGuards } from '@nestjs/common';
import { Args, Int, Resolver, Subscription } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity, OrderStatus } from '@hancr/database';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { Repository } from 'typeorm';
import { JwtAuthGuard, CurrentUser } from '../auth/jwt-auth.guard';
import { AuthUser } from '../auth/jwt.strategy';
import { PUB_SUB } from '../pubsub.provider';
import { DriverLocationType } from './dto/driver-location.type';

export const DRIVER_LOCATION_UPDATED = 'DRIVER_LOCATION_UPDATED';

const TRACKABLE_ORDER_STATUSES = new Set<OrderStatus>([
  OrderStatus.DriverAccepted,
  OrderStatus.WaitingForPrePay,
  OrderStatus.Arrived,
  OrderStatus.Started,
  OrderStatus.WaitingForPostPay,
  OrderStatus.WaitingForReview,
]);

/**
 * Live driver-location stream for the rider app.
 *
 * Security: rider JWT auth and active order ownership are required before
 * opening the stream.
 */
@Resolver()
export class TrackingResolver {
  constructor(
    @Inject(PUB_SUB) private readonly pubSub: RedisPubSub,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
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
  @UseGuards(JwtAuthGuard)
  async driverLocationUpdated(
    @CurrentUser() user: AuthUser,
    @Args('driverId', { type: () => Int }) driverId: number,
    @Args('orderId', { type: () => Int }) orderId: number,
  ): Promise<AsyncIterator<unknown>> {
    await this.assertCanTrackDriver(user.riderId, orderId, driverId);
    return this.pubSub.asyncIterator(DRIVER_LOCATION_UPDATED);
  }

  private async assertCanTrackDriver(
    riderId: number,
    orderId: number,
    driverId: number,
  ): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, riderId, driverId },
      select: ['id', 'status'],
    });

    if (!order || !TRACKABLE_ORDER_STATUSES.has(order.status)) {
      throw new ForbiddenException('Tracking is not allowed for this order');
    }
  }
}
