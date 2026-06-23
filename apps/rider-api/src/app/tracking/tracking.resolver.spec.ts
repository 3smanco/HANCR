import { ForbiddenException } from '@nestjs/common';
import { OrderEntity, OrderStatus } from '@hancr/database';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { Repository } from 'typeorm';
import { TrackingResolver } from './tracking.resolver';

type PubSubMock = {
  asyncIterator: jest.Mock<AsyncIterator<unknown>, [string]>;
};

type OrderRepoMock = {
  findOne: jest.Mock<Promise<Pick<OrderEntity, 'id' | 'status'> | null>, [unknown]>;
};

function buildResolver(order: Pick<OrderEntity, 'id' | 'status'> | null) {
  const iterator = {} as AsyncIterator<unknown>;
  const pubSub: PubSubMock = {
    asyncIterator: jest.fn((_channel: string) => iterator),
  };
  const orderRepo: OrderRepoMock = {
    findOne: jest.fn(async (_options: unknown) => order),
  };

  return {
    resolver: new TrackingResolver(
      pubSub as unknown as RedisPubSub,
      orderRepo as unknown as Repository<OrderEntity>,
    ),
    pubSub,
    orderRepo,
    iterator,
  };
}

describe('TrackingResolver', () => {
  it('opens driver location subscriptions only for an active owned order', async () => {
    const { resolver, pubSub, orderRepo, iterator } = buildResolver({
      id: 17,
      status: OrderStatus.Started,
    });

    await expect(
      resolver.driverLocationUpdated({ riderId: 7, phone: '+974' }, 42, 17),
    ).resolves.toBe(iterator);

    expect(orderRepo.findOne).toHaveBeenCalledWith({
      where: { id: 17, riderId: 7, driverId: 42 },
      select: ['id', 'status'],
    });
    expect(pubSub.asyncIterator).toHaveBeenCalledWith('DRIVER_LOCATION_UPDATED');
  });

  it('rejects tracking when the rider/order/driver relationship is not valid', async () => {
    const { resolver, pubSub } = buildResolver(null);

    await expect(
      resolver.driverLocationUpdated({ riderId: 7, phone: '+974' }, 42, 17),
    ).rejects.toThrow(ForbiddenException);

    expect(pubSub.asyncIterator).not.toHaveBeenCalled();
  });

  it('rejects tracking after the order leaves live tracking states', async () => {
    const { resolver, pubSub } = buildResolver({
      id: 17,
      status: OrderStatus.Finished,
    });

    await expect(
      resolver.driverLocationUpdated({ riderId: 7, phone: '+974' }, 42, 17),
    ).rejects.toThrow(ForbiddenException);

    expect(pubSub.asyncIterator).not.toHaveBeenCalled();
  });
});
