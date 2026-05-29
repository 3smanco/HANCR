import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderStatus } from '@hancr/database';
import { AdminOrderType, OrderListResult } from './dto/admin-order.type';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  async listOrders(
    page = 1,
    limit = 20,
    status?: string,
    riderId?: number,
    driverId?: number,
  ): Promise<OrderListResult> {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.rider', 'rider')
      .leftJoinAndSelect('o.driver', 'driver')
      .leftJoinAndSelect('o.service', 'service')
      .leftJoinAndSelect('o.region', 'region')
      .orderBy('o.createdOn', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      qb.andWhere('o.status = :status', { status });
    }
    if (riderId) {
      qb.andWhere('o.riderId = :riderId', { riderId });
    }
    if (driverId) {
      qb.andWhere('o.driverId = :driverId', { driverId });
    }

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((o) => this.toType(o)),
      total,
      page,
      limit,
    };
  }

  async getOrder(id: number): Promise<AdminOrderType> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['rider', 'driver', 'service', 'region'],
    });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return this.toType(order);
  }

  /** Force-cancel a problematic order */
  async forceCancel(id: number): Promise<AdminOrderType> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`Order #${id} not found`);

    const nonTerminalStatuses: OrderStatus[] = [
      OrderStatus.Requested,
      OrderStatus.Found,
      OrderStatus.DriverAccepted,
      OrderStatus.Arrived,
      OrderStatus.Started,
      OrderStatus.WaitingForPrePay,
      OrderStatus.WaitingForPostPay,
      OrderStatus.WaitingForReview,
    ];

    if (!nonTerminalStatuses.includes(order.status)) {
      throw new Error(`Order is already in terminal state: ${order.status}`);
    }

    await this.orderRepo.update(id, { status: OrderStatus.RiderCanceled });
    const updated = await this.orderRepo.findOne({
      where: { id },
      relations: ['rider', 'driver', 'service', 'region'],
    });
    return this.toType(updated!);
  }

  private toType(e: OrderEntity): AdminOrderType {
    const t = new AdminOrderType();
    t.id = e.id;
    t.type = e.type;
    t.status = e.status;
    t.currency = e.currency;
    t.riderId = e.riderId;
    t.riderPhone = e.rider?.phoneNumber;
    t.driverId = e.driverId;
    t.driverPhone = e.driver?.phoneNumber;
    t.serviceId = e.serviceId;
    t.serviceName = e.service?.name;
    t.regionId = e.regionId;
    t.regionName = e.region?.name;
    t.costBest = Number(e.costBest);
    t.costAfterCoupon = Number(e.costAfterCoupon);
    t.paidAmount = Number(e.paidAmount);
    t.providerShare = Number(e.providerShare);
    t.distanceBest = e.distanceBest;
    t.durationBest = e.durationBest;
    t.isBidOrder = e.isBidOrder;
    t.paymentMode = e.paymentMode;
    t.startTimestamp = e.startTimestamp;
    t.finishTimestamp = e.finishTimestamp;
    t.createdOn = e.createdOn;
    t.updatedAt = e.updatedAt;
    return t;
  }
}
