import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DriverEntity,
  OrderEntity,
  OrderMessageEntity,
  OrderStatus,
  RequestActivityEntity,
  RequestActivityType,
} from '@hancr/database';
import { DriverRedisService } from '@hancr/redis';
import {
  AdminNearbyDriverType,
  AdminOrderActivityType,
  AdminOrderDetailType,
  AdminOrderMessageType,
} from './dto/order-detail.types';

@Injectable()
export class OrderDetailService {
  private readonly logger = new Logger(OrderDetailService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(RequestActivityEntity)
    private readonly activityRepo: Repository<RequestActivityEntity>,
    @InjectRepository(OrderMessageEntity)
    private readonly messageRepo: Repository<OrderMessageEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    private readonly driverRedis: DriverRedisService,
  ) {}

  async getDetail(orderId: number): Promise<AdminOrderDetailType> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['rider', 'driver', 'service', 'region'],
    });
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);

    const [activities, messages] = await Promise.all([
      this.activityRepo.find({
        where: { orderId },
        order: { occurredAt: 'ASC' },
      }),
      this.messageRepo.find({
        where: { orderId },
        order: { sentAt: 'ASC' },
        take: 200,
      }),
    ]);

    return this.toDetailType(order, activities, messages);
  }

  /**
   * Find drivers near the order's pickup, similar to MatchingService but
   * without applying soft-filters — admin override.
   */
  async findCandidates(orderId: number): Promise<AdminNearbyDriverType[]> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);
    const origin = order.points?.[0];
    if (!origin) return [];

    const nearby = await this.driverRedis.findNearbyDrivers(
      origin.lat,
      origin.lng,
      10_000, // 10 km
      order.serviceId,
    );
    if (nearby.length === 0) return [];

    const driverIds = nearby.map((n) => n.driverId);
    const drivers = await this.driverRepo.findByIds(driverIds);
    const map = new Map(drivers.map((d) => [d.id, d]));

    return nearby
      .map((n) => {
        const d = map.get(n.driverId);
        if (!d || !d.active || d.banned) return null;
        const distanceKm = n.distanceMeters / 1000;
        return {
          driverId: d.id,
          driverName: [d.firstName, d.lastName].filter(Boolean).join(' ') || `Driver #${d.id}`,
          driverPhone: d.phoneNumber,
          distanceMeters: n.distanceMeters,
          etaMinutes: Math.ceil(distanceKm * 1.5),
          status: d.status,
        } as AdminNearbyDriverType;
      })
      .filter((x): x is AdminNearbyDriverType => x !== null);
  }

  /**
   * Force-assign a specific driver to an order regardless of matching filters.
   * Used by ops as a fallback when the auto-matcher can't find drivers.
   */
  async assignDriver(
    orderId: number,
    driverId: number,
  ): Promise<AdminOrderDetailType> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order #${orderId} not found`);
    if (
      ![OrderStatus.Requested, OrderStatus.Found, OrderStatus.NotFound].includes(
        order.status,
      )
    ) {
      throw new BadRequestException(
        `Cannot assign: order is in ${order.status}`,
      );
    }
    const driver = await this.driverRepo.findOne({ where: { id: driverId } });
    if (!driver) throw new NotFoundException(`Driver #${driverId} not found`);
    if (driver.banned || !driver.active) {
      throw new BadRequestException('Driver is not active');
    }

    await this.orderRepo.update(orderId, {
      driverId,
      status: OrderStatus.DriverAccepted,
    });
    await this.activityRepo.save(
      this.activityRepo.create({
        orderId,
        type: RequestActivityType.DriverAccepted,
      }),
    );
    this.logger.log(`Admin force-assigned driver #${driverId} to order #${orderId}`);

    return this.getDetail(orderId);
  }

  // ─── Mappers ─────────────────────────────────────────────────────────────

  private toDetailType(
    o: OrderEntity,
    activities: RequestActivityEntity[],
    messages: OrderMessageEntity[],
  ): AdminOrderDetailType {
    const rider = (o as OrderEntity & { rider?: { firstName?: string; lastName?: string; phoneNumber?: string } }).rider;
    const driver = (o as OrderEntity & { driver?: { firstName?: string; lastName?: string; phoneNumber?: string } }).driver;
    const service = (o as OrderEntity & { service?: { name?: string } }).service;
    return {
      id: o.id,
      type: o.type,
      status: o.status,
      currency: o.currency,
      riderId: o.riderId,
      riderName: rider
        ? [rider.firstName, rider.lastName].filter(Boolean).join(' ') ||
          undefined
        : undefined,
      riderPhone: rider?.phoneNumber,
      driverId: o.driverId,
      driverName: driver
        ? [driver.firstName, driver.lastName].filter(Boolean).join(' ') ||
          undefined
        : undefined,
      driverPhone: driver?.phoneNumber,
      serviceId: o.serviceId,
      serviceName: service?.name,
      regionId: o.regionId,
      points: o.points,
      addresses: o.addresses ?? [],
      distanceBest: o.distanceBest,
      durationBest: o.durationBest,
      costBest: Number(o.costBest),
      costAfterCoupon: Number(o.costAfterCoupon),
      paidAmount: Number(o.paidAmount),
      providerShare: Number(o.providerShare),
      discountAmount: Number(o.discountAmount ?? 0),
      couponCode: o.couponCode,
      paymentMode: o.paymentMode,
      familyMode: o.familyMode,
      preferFemaleDriver: o.preferFemaleDriver,
      nightShift: o.nightShift,
      preferredDriverId: o.preferredDriverId,
      bookedHours: o.bookedHours,
      entitlementId: o.entitlementId,
      companyId: o.companyId,
      startTimestamp: o.startTimestamp,
      finishTimestamp: o.finishTimestamp,
      etaPickup: o.etaPickup,
      createdOn: o.createdOn,
      activities: activities.map((a) => this.toActivityType(a)),
      messages: messages.map((m) => this.toMessageType(m)),
    };
  }

  private toActivityType(a: RequestActivityEntity): AdminOrderActivityType {
    return {
      id: a.id,
      type: a.type,
      createdAt: a.occurredAt,
    };
  }

  private toMessageType(m: OrderMessageEntity): AdminOrderMessageType {
    return {
      id: m.id,
      senderType: m.senderType,
      senderId: m.senderId,
      message: m.message,
      sentAt: m.sentAt,
    };
  }
}
