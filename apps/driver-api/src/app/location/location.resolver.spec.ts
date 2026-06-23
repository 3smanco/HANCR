import { ForbiddenException } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { LocationResolver } from './location.resolver';
import { LocationService } from './location.service';

type PubSubMock = {
  asyncIterator: jest.Mock<AsyncIterator<unknown>, [string]>;
};

describe('LocationResolver subscriptions', () => {
  it('allows a driver to subscribe only to their own location events', () => {
    const iterator = {} as AsyncIterator<unknown>;
    const pubSub: PubSubMock = {
      asyncIterator: jest.fn((_channel: string) => iterator),
    };
    const resolver = new LocationResolver(
      {} as LocationService,
      pubSub as unknown as RedisPubSub,
    );

    expect(
      resolver.driverLocationUpdated({ driverId: 42, phone: '+974' }, 42),
    ).toBe(iterator);
    expect(pubSub.asyncIterator).toHaveBeenCalledWith('DRIVER_LOCATION_UPDATED');
  });

  it('rejects subscriptions for another driver location stream', () => {
    const pubSub: PubSubMock = {
      asyncIterator: jest.fn(),
    };
    const resolver = new LocationResolver(
      {} as LocationService,
      pubSub as unknown as RedisPubSub,
    );

    expect(() =>
      resolver.driverLocationUpdated({ driverId: 42, phone: '+974' }, 99),
    ).toThrow(ForbiddenException);
    expect(pubSub.asyncIterator).not.toHaveBeenCalled();
  });
});
