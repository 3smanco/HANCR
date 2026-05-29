import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DashboardStats, RevenueStats } from './dto/analytics.types';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';

@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => DashboardStats, { description: 'إحصائيات لوحة التحكم' })
  @UseGuards(AdminJwtGuard)
  dashboardStats(): Promise<DashboardStats> {
    return this.analyticsService.getDashboardStats();
  }

  @Query(() => [RevenueStats], { description: 'إحصائيات الإيرادات اليومية' })
  @UseGuards(AdminJwtGuard)
  revenueStats(
    @Args('days', { type: () => Int, defaultValue: 30 }) days: number,
  ): Promise<RevenueStats[]> {
    return this.analyticsService.getRevenueStats(days);
  }
}
