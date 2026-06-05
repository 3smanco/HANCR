import { Resolver, Query } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  DriverEntity,
  OrderEntity,
  OrderStatus,
} from '@hancr/database';
import { DriverRedisService } from '@hancr/redis';
import { LiveDriverType, LiveDriversResult } from './dto/live.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Injectable()
export class LiveService {
  constructor(
    private readonly driverRedis: DriverRedisService,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  async snapshot(): Promise<LiveDriversResult> {
    const drivers = await this.driverRedis.getAllOnlineDrivers(500);
    if (drivers.length === 0) {
      return { total: 0, idle: 0, inRide: 0, drivers: [] };
    }

    const ids = drivers.map((d) => d.driverId);
    const entities = await this.driverRepo.findBy({ id: In(ids) });
    const dMap = new Map(entities.map((d) => [d.id, d]));

    // Find current active orders for these drivers
    const activeOrders = await this.orderRepo.find({
      where: {
        driverId: In(ids),
        status: In([
          OrderStatus.DriverAccepted,
          OrderStatus.Arrived,
          OrderStatus.Started,
        ]),
      },
      select: ['id', 'driverId', 'status'],
    });
    const orderMap = new Map<number, OrderEntity>();
    for (const o of activeOrders) {
      if (o.driverId) orderMap.set(o.driverId, o);
    }

    let idle = 0;
    let inRide = 0;
    const items: LiveDriverType[] = drivers.map((d) => {
      const entity = dMap.get(d.driverId);
      const order = orderMap.get(d.driverId);
      const status = order
        ? 'in_ride'
        : entity?.status === 'Online'
          ? 'idle'
          : 'idle';
      if (status === 'in_ride') inRide++;
      else idle++;
      return {
        driverId: d.driverId,
        driverName: entity
          ? [entity.firstName, entity.lastName].filter(Boolean).join(' ') ||
            undefined
          : undefined,
        driverPhone: entity?.phoneNumber,
        plateNumber: entity?.plateNumber,
        carBrand: entity?.carBrand,
        carModel: entity?.carModel,
        lat: d.lat,
        lng: d.lng,
        heading: d.heading,
        status,
        currentOrderId: order?.id ?? 0,
      };
    });

    return { total: items.length, idle, inRide, drivers: items };
  }
}

@Resolver()
export class LiveResolver {
  constructor(private readonly service: LiveService) {}

  @Query(() => LiveDriversResult, {
    description: 'لقطة لجميع السائقين Online مع مواقعهم وحالاتهم',
  })
  @UseGuards(AdminJwtGuard)
  liveDrivers(): Promise<LiveDriversResult> {
    return this.service.snapshot();
  }
}
