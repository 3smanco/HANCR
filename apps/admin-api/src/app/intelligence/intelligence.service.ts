import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import {
  AppConfigEntity,
  DriverEntity,
  DriverStatus,
  OrderEntity,
} from '@hancr/database';
import { CronLockService } from '@hancr/redis';
import { BroadcastService } from '../notifications/broadcast.service';
import { BroadcastTarget } from '../notifications/dto/broadcast.types';
import { SurgeStateType } from './intelligence.types';

interface Campaign {
  id?: string;
  title: string;
  body: string;
  target?: BroadcastTarget;
  scheduledAt?: string;
  status?: 'scheduled' | 'sent' | 'failed';
  sentAt?: string;
  error?: string;
}

/**
 * N11 — ذكاء اللوحة: محرّك surge (طلب/عرض) + مُرسِل الحملات المجدولة.
 * cron كل دقيقة: يُرسل الحملات المستحقة، ويطبّق surge تلقائياً إن فُعِّل.
 */
@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepo: Repository<DriverEntity>,
    @InjectRepository(AppConfigEntity)
    private readonly cfgRepo: Repository<AppConfigEntity>,
    private readonly broadcast: BroadcastService,
    private readonly cronLock: CronLockService,
  ) {}

  async surgeState(): Promise<SurgeStateType> {
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const recentDemand = await this.orderRepo.count({
      where: { createdOn: MoreThan(since) },
    });
    const driversOnline = await this.driverRepo.count({
      where: { status: DriverStatus.Online },
    });
    const suggested = this.suggest(recentDemand, driversOnline);

    const cfg = await this.cfgRepo.findOne({ where: { configKey: 'main' } });
    const surge = this.surgeCfg(cfg);
    return {
      recentDemand,
      driversOnline,
      suggestedMultiplier: suggested,
      currentMultiplier: Number(surge.multiplier ?? 1),
      autoSurge: Boolean(surge.auto ?? false),
    };
  }

  /** يُرسل الحملات المجدولة المستحقة الآن. يُعيد عدد ما أُرسل. */
  async dispatchDueCampaigns(): Promise<number> {
    const cfg = await this.cfgRepo.findOne({ where: { configKey: 'main' } });
    if (!cfg) return 0;
    const ops = (cfg.operationsConfig ?? {}) as Record<string, unknown>;
    const campaigns: Campaign[] = Array.isArray(ops['campaigns'])
      ? (ops['campaigns'] as Campaign[])
      : [];
    const now = Date.now();
    let dispatched = 0;
    let changed = false;

    for (const c of campaigns) {
      if (
        c.status === 'scheduled' &&
        c.scheduledAt &&
        new Date(c.scheduledAt).getTime() <= now
      ) {
        try {
          await this.broadcast.broadcast(
            c.title,
            c.body,
            c.target ?? BroadcastTarget.All,
          );
          c.status = 'sent';
          c.sentAt = new Date().toISOString();
          dispatched++;
        } catch (e) {
          c.status = 'failed';
          c.error = (e as Error).message;
        }
        changed = true;
      }
    }

    if (changed) {
      ops['campaigns'] = campaigns;
      cfg.operationsConfig = ops as AppConfigEntity['operationsConfig'];
      await this.cfgRepo.save(cfg);
    }
    return dispatched;
  }

  /** يطبّق المضاعِف المقترح تلقائياً عند تفعيل autoSurge. */
  private async applyAutoSurge(): Promise<void> {
    const cfg = await this.cfgRepo.findOne({ where: { configKey: 'main' } });
    if (!cfg) return;
    const surge = this.surgeCfg(cfg);
    if (!surge.auto) return;

    const since = new Date(Date.now() - 30 * 60 * 1000);
    const recentDemand = await this.orderRepo.count({
      where: { createdOn: MoreThan(since) },
    });
    const driversOnline = await this.driverRepo.count({
      where: { status: DriverStatus.Online },
    });
    const suggested = this.suggest(recentDemand, driversOnline);

    if (Number(surge.multiplier ?? 1) !== suggested) {
      const prc = (cfg.pricingRulesConfig ?? {}) as Record<string, unknown>;
      prc['surge'] = { ...surge, multiplier: suggested };
      cfg.pricingRulesConfig = prc as AppConfigEntity['pricingRulesConfig'];
      await this.cfgRepo.save(cfg);
      this.logger.log(`auto-surge → ${suggested}× (demand ${recentDemand}/${driversOnline})`);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    // قفل موزّع: instance واحد فقط ينفّذ (يمنع إرسال الحملات وحساب surge مكرّراً).
    if (!(await this.cronLock.acquire('intelligence:tick', 50))) return;
    try {
      await this.dispatchDueCampaigns();
    } catch (e) {
      this.logger.warn(`campaign dispatch failed: ${(e as Error).message}`);
    }
    try {
      await this.applyAutoSurge();
    } catch (e) {
      this.logger.warn(`auto-surge failed: ${(e as Error).message}`);
    }
  }

  private suggest(demand: number, drivers: number): number {
    const ratio = demand / Math.max(drivers, 1);
    return Math.min(3, Math.max(1, Math.round((1 + ratio * 0.25) * 10) / 10));
  }

  private surgeCfg(cfg: AppConfigEntity | null): {
    multiplier?: number;
    auto?: boolean;
  } {
    const prc = (cfg?.pricingRulesConfig ?? {}) as Record<string, unknown>;
    return (prc['surge'] ?? {}) as { multiplier?: number; auto?: boolean };
  }
}
