import { Resolver, Query, Args } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  DriverEntity,
  OrderEntity,
  OrderStatus,
} from '@hancr/database';
import { DriverRedisService } from '@hancr/redis';
import { DataSource } from 'typeorm';
import { LiveDriverType, LiveDriversResult } from './dto/live.types';
import { AdminJwtGuard, CurrentAdmin } from '../auth/admin-jwt.guard';
import type { AdminUser } from '../auth/admin-jwt.strategy';
import { ScopeService } from '../scope/scope.service';

interface RegionCountry {
  countryIso: string | null;
}

@Injectable()
export class LiveService {
  constructor(
    private readonly driverRedis: DriverRedisService,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * لقطة السائقين Online مع مواقعهم. مُثراة بالدولة (عبر منطقة السائق) وقابلة
   * للفلترة بالنطاق (allowedRegionIds) وبدولة محدَّدة (countryIso) — للخريطة
   * المسطّحة لكل دولة.
   */
  async snapshot(opts?: {
    countryIso?: string | null;
    allowedRegionIds?: number[] | null;
  }): Promise<LiveDriversResult> {
    const drivers = await this.driverRedis.getAllOnlineDrivers(500);
    if (drivers.length === 0) {
      return { total: 0, idle: 0, inRide: 0, drivers: [] };
    }

    const ids = drivers.map((d) => d.driverId);
    const entities = await this.driverRepo.findBy({ id: In(ids) });
    const dMap = new Map(entities.map((d) => [d.id, d]));

    // خريطة منطقة → دولة (iso2) للإثراء والفلترة.
    const regionIds = Array.from(
      new Set(
        entities
          .map((e) => e.regionId)
          .filter((r): r is number => r != null),
      ),
    );
    const regionToIso = new Map<number, string | null>();
    if (regionIds.length > 0) {
      const rows = await this.dataSource.query<
        Array<{ id: number } & RegionCountry>
      >(
        `SELECT r.id, c.iso2 AS "countryIso"
         FROM hancr_region r LEFT JOIN hancr_country c ON c.id = r.country_id
         WHERE r.id = ANY($1)`,
        [regionIds],
      );
      for (const row of rows) regionToIso.set(row.id, row.countryIso);
    }

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

    const wantIso = opts?.countryIso?.trim().toUpperCase() || null;
    const allowed = opts?.allowedRegionIds ?? null;

    let idle = 0;
    let inRide = 0;
    const items: LiveDriverType[] = [];
    for (const d of drivers) {
      const entity = dMap.get(d.driverId);
      const regionId = entity?.regionId ?? undefined;
      const countryIso =
        regionId != null ? regionToIso.get(regionId) ?? undefined : undefined;

      // فلترة النطاق: المُنطقَن يرى مناطقه فقط.
      if (allowed && (regionId == null || !allowed.includes(regionId))) {
        continue;
      }
      // فلترة الدولة المختارة.
      if (wantIso && countryIso !== wantIso) continue;

      const order = orderMap.get(d.driverId);
      const status = order ? 'in_ride' : 'idle';
      if (status === 'in_ride') inRide++;
      else idle++;

      items.push({
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
        regionId,
        countryIso: countryIso ?? undefined,
      });
    }

    return { total: items.length, idle, inRide, drivers: items };
  }
}

@Resolver()
export class LiveResolver {
  constructor(
    private readonly service: LiveService,
    private readonly scope: ScopeService,
  ) {}

  @Query(() => LiveDriversResult, {
    description:
      'لقطة لجميع السائقين Online مع مواقعهم وحالاتهم (scope + country aware)',
  })
  @UseGuards(AdminJwtGuard)
  async liveDrivers(
    @CurrentAdmin() admin: AdminUser,
    @Args('countryIso', { nullable: true }) countryIso?: string,
  ): Promise<LiveDriversResult> {
    const allowedRegionIds = await this.scope.allowedRegionIds({
      adminId: admin.adminId,
      role: admin.role,
    });
    return this.service.snapshot({ countryIso, allowedRegionIds });
  }
}
