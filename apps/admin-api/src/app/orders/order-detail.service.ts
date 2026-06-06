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
  OrderType,
  PaymentMode,
  RequestActivityEntity,
  RequestActivityType,
  RiderEntity,
  ServiceEntity,
} from '@hancr/database';
import { DriverRedisService } from '@hancr/redis';
import {
  AdminCreateOrderInput,
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
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
    @InjectRepository(ServiceEntity)
    private readonly serviceRepo: Repository<ServiceEntity>,
    private readonly driverRedis: DriverRedisService,
  ) {}

  /**
   * K4 — Dispatcher: create an order on behalf of a rider.
   * Uses haversine distance + service rates; skips coupon/pool/bid logic.
   * If driverIdHint is supplied the driver is force-assigned in the same call.
   */
  async createManualOrder(
    input: AdminCreateOrderInput,
  ): Promise<AdminOrderDetailType> {
    const rider = await this.riderRepo.findOne({ where: { id: input.riderId } });
    if (!rider) throw new NotFoundException(`Rider #${input.riderId} not found`);
    if (rider.banned) throw new BadRequestException('Rider is banned');

    const service = await this.serviceRepo.findOne({
      where: { id: input.serviceId },
    });
    if (!service) throw new NotFoundException(`Service #${input.serviceId} not found`);

    const distanceMeters = haversineMeters(
      input.origin.lat,
      input.origin.lng,
      input.destination.lat,
      input.destination.lng,
    );
    // Rough city-driving estimate: 30 km/h average.
    const durationSeconds = Math.round((distanceMeters / 1000 / 30) * 3600);

    const baseFare = Number(service.baseFare);
    const perKm = Number(service.perHundredMeters) * 10;
    const perMin = Number(service.perMinuteDrive);
    const cost =
      Math.round(
        (baseFare + (distanceMeters / 1000) * perKm + (durationSeconds / 60) * perMin) *
          100,
      ) / 100;

    const order = this.orderRepo.create({
      riderId: input.riderId,
      serviceId: input.serviceId,
      regionId: input.regionId,
      type: OrderType.Ride,
      status: OrderStatus.Requested,
      currency: rider.currency ?? 'SAR',
      points: [
        { lat: input.origin.lat, lng: input.origin.lng },
        { lat: input.destination.lat, lng: input.destination.lng },
      ],
      addresses: [
        input.originAddress ?? '',
        input.destinationAddress ?? '',
      ],
      distanceBest: distanceMeters,
      durationBest: durationSeconds,
      costBest: cost,
      costAfterCoupon: cost,
      paidAmount: 0,
      providerShare: 0,
      paymentMode: PaymentMode.Cash,
    });
    const saved = await this.orderRepo.save(order);

    await this.activityRepo.save(
      this.activityRepo.create({
        orderId: saved.id,
        type: RequestActivityType.RequestedByOperator,
      }),
    );
    this.logger.log(`Admin manually created order #${saved.id} for rider #${rider.id}`);

    if (input.driverIdHint) {
      return this.assignDriver(saved.id, input.driverIdHint);
    }
    return this.getDetail(saved.id);
  }

  /**
   * K4 — Lookup a rider by phone number for the dispatcher autocomplete.
   * Returns at most 10 matches.
   */
  async searchRidersByPhone(query: string): Promise<Array<{
    id: number;
    name: string;
    phone: string;
  }>> {
    const q = query.trim();
    if (q.length < 3) return [];
    const riders = await this.riderRepo
      .createQueryBuilder('r')
      .where('r.phoneNumber LIKE :q', { q: `%${q}%` })
      .andWhere('r.banned = false')
      .limit(10)
      .getMany();
    return riders.map((r) => ({
      id: r.id,
      name:
        [r.firstName, r.lastName].filter(Boolean).join(' ') ||
        `Rider #${r.id}`,
      phone: r.phoneNumber ?? '',
    }));
  }

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

// ─── Geometry helpers ─────────────────────────────────────────────────────

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
