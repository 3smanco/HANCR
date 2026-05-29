import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OrderEntity,
  RiderEntity,
  DriverEntity,
} from '@hancr/database';
import { OrderStatus } from '@hancr/database';
import { DashboardStats, RevenueStats } from './dto/analytics.types';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(RiderEntity)
    private readonly riderRepo: Repository<RiderEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalRiders,
      totalDrivers,
      activeDrivers,
      pendingDrivers,
      totalOrders,
      completedOrders,
      canceledOrders,
    ] = await Promise.all([
      this.riderRepo.count(),
      this.driverRepo.count({ where: { active: true } }),
      this.driverRepo.count({ where: { status: 'Online' as unknown as never } }),
      this.driverRepo.count({ where: { active: false, banned: false } }),
      this.orderRepo.count(),
      this.orderRepo.count({ where: { status: OrderStatus.Finished } }),
      this.orderRepo.count({ where: [
        { status: OrderStatus.RiderCanceled },
        { status: OrderStatus.DriverCanceled },
      ]}),
    ]);

    // Revenue totals
    const revenueResult = await this.orderRepo
      .createQueryBuilder('o')
      .select('SUM(o.costBest)', 'totalRevenue')
      .addSelect('SUM(o.providerShare)', 'platformRevenue')
      .where('o.status = :status', { status: OrderStatus.Finished })
      .getRawOne<{ totalRevenue: string; platformRevenue: string }>();

    const stats = new DashboardStats();
    stats.totalRiders = totalRiders;
    stats.totalDrivers = totalDrivers;
    stats.activeDrivers = activeDrivers;
    stats.pendingDriverApprovals = pendingDrivers;
    stats.totalOrders = totalOrders;
    stats.completedOrders = completedOrders;
    stats.canceledOrders = canceledOrders;
    stats.totalRevenue = Number(revenueResult?.totalRevenue ?? 0);
    stats.platformRevenue = Number(revenueResult?.platformRevenue ?? 0);
    return stats;
  }

  async getRevenueStats(days = 30): Promise<RevenueStats[]> {
    const results = await this.orderRepo
      .createQueryBuilder('o')
      .select("DATE_TRUNC('day', o.createdOn)", 'date')
      .addSelect('COUNT(o.id)', 'orderCount')
      .addSelect('SUM(o.costBest)', 'revenue')
      .addSelect('SUM(o.providerShare)', 'platformRevenue')
      .where('o.status = :status', { status: OrderStatus.Finished })
      .andWhere(`o.createdOn >= NOW() - INTERVAL '${days} days'`)
      .groupBy("DATE_TRUNC('day', o.createdOn)")
      .orderBy("DATE_TRUNC('day', o.createdOn)", 'ASC')
      .getRawMany<{ date: Date; orderCount: string; revenue: string; platformRevenue: string }>();

    return results.map((r) => {
      const s = new RevenueStats();
      s.date = r.date;
      s.orderCount = Number(r.orderCount);
      s.revenue = Number(r.revenue ?? 0);
      s.platformRevenue = Number(r.platformRevenue ?? 0);
      return s;
    });
  }
}
