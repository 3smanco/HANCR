import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import {
  OrderEntity,
  WalletTransactionEntity,
  WalletOwnerType,
  WalletTransactionType,
  WalletTransactionStatus,
} from '@hancr/database';
import { DailyEarningType, DemandZoneType } from './driver-tools.types';

/**
 * N10 — أدوات السائق: أرباح يومية (للرسم + الأهداف) + خريطة الطلب الساخنة.
 * يجمّع في الذاكرة (JS) لتفادي هشاشة أسماء الأعمدة في SQL الخام.
 */
@Injectable()
export class DriverToolsService {
  constructor(
    @InjectRepository(WalletTransactionEntity)
    private readonly walletRepo: Repository<WalletTransactionEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  /** أرباح السائق اليومية لآخر [days] يوماً (الأيام الفارغة تُملأ بصفر). */
  async dailyEarnings(
    driverId: number,
    days: number,
  ): Promise<DailyEarningType[]> {
    const span = Math.min(Math.max(Math.trunc(days) || 7, 1), 31);
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (span - 1));

    const txs = await this.walletRepo.find({
      where: {
        ownerType: WalletOwnerType.Driver,
        ownerId: driverId,
        type: WalletTransactionType.DriverEarnings,
        status: WalletTransactionStatus.Completed,
        createdAt: MoreThanOrEqual(since),
      },
      select: ['amount', 'createdAt'],
    });

    const byDate = new Map<string, number>();
    for (const t of txs) {
      const key = this.dayKey(t.createdAt);
      byDate.set(key, (byDate.get(key) ?? 0) + Number(t.amount));
    }

    const out: DailyEarningType[] = [];
    for (let i = 0; i < span; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = this.dayKey(d);
      out.push({
        date: key,
        amount: Math.round((byDate.get(key) ?? 0) * 100) / 100,
      });
    }
    return out;
  }

  /** مناطق الطلب الساخنة من رحلات آخر 90 دقيقة (تجميع نقاط الانطلاق المقرّبة). */
  async demandZones(): Promise<DemandZoneType[]> {
    const since = new Date(Date.now() - 90 * 60 * 1000);
    const orders = await this.orderRepo.find({
      where: { createdOn: MoreThan(since) },
      select: ['id', 'points'],
      take: 1500,
    });

    const map = new Map<string, DemandZoneType>();
    for (const o of orders) {
      const p = o.points?.[0];
      if (!p) continue;
      const lat = Math.round(p.lat * 100) / 100;
      const lng = Math.round(p.lng * 100) / 100;
      const key = `${lat},${lng}`;
      const z = map.get(key) ?? { lat, lng, weight: 0 };
      z.weight += 1;
      map.set(key, z);
    }
    return [...map.values()]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 60);
  }

  /** مفتاح يوم محلي ثابت YYYY-MM-DD. */
  private dayKey(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
