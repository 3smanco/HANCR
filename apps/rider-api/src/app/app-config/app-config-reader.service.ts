import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfigEntity } from '@hancr/database';

/**
 * N1 — AppConfigReader
 *
 * Single source of truth for operational values that used to be hardcoded
 * (OTP TTL, search radius, loyalty thresholds, cancellation rules, ...).
 * Reads the 'main' row of hancr_app_config and caches it for 60s so we
 * don't hit the DB on every order/auth call. Admin edits take effect
 * within one cache window — no deploy needed.
 *
 * Every getter merges stored values over a hardcoded default so the system
 * behaves identically if a key is missing (zero-risk rollout).
 */

export interface OperationsConfig {
  otpTtlSeconds: number;
  maxOtpAttempts: number;
  otpResendCooldownSeconds: number;
  searchRadiusKm: number;
  etaMinutesPerKm: number;
  matchingTimeoutSeconds: number;
}

export interface SurgeRule {
  regionId?: number;
  dayOfWeek?: number; // 0=Sun .. 6=Sat; omit = any day
  fromHour: number; // 0..23 inclusive
  toHour: number; // 0..23 inclusive
  multiplier: number;
}

export interface PricingRulesConfig {
  cancellationFee: number;
  cancellationGraceSeconds: number;
  cancellableStatuses: string[];
  surge: SurgeRule[];
}

export interface LoyaltyConfig {
  tierThresholds: Record<string, number>;
  milesPerCurrency: number;
  milesToCurrency: number;
  minRedeem: number;
  redeemStep: number;
  referralBonus: number;
}

const DEFAULT_OPERATIONS: OperationsConfig = {
  otpTtlSeconds: 300,
  maxOtpAttempts: 5,
  otpResendCooldownSeconds: 60,
  searchRadiusKm: 5,
  etaMinutesPerKm: 1.5,
  matchingTimeoutSeconds: 60,
};

const DEFAULT_PRICING_RULES: PricingRulesConfig = {
  cancellationFee: 0,
  cancellationGraceSeconds: 120,
  cancellableStatuses: [
    'Requested',
    'NotFound',
    'Found',
    'DriverAccepted',
    'Booked',
  ],
  surge: [],
};

const DEFAULT_LOYALTY: LoyaltyConfig = {
  tierThresholds: { Bronze: 0, Silver: 500, Gold: 2000, Platinum: 5000 },
  milesPerCurrency: 1,
  milesToCurrency: 0.05,
  minRedeem: 100,
  redeemStep: 50,
  referralBonus: 15,
};

const CACHE_TTL_MS = 60_000;
const MAIN_KEY = 'main';

@Injectable()
export class AppConfigReader {
  private readonly logger = new Logger(AppConfigReader.name);
  private cache: AppConfigEntity | null = null;
  private cachedAt = 0;
  private inflight: Promise<AppConfigEntity | null> | null = null;

  constructor(
    @InjectRepository(AppConfigEntity)
    private readonly repo: Repository<AppConfigEntity>,
  ) {}

  private async load(): Promise<AppConfigEntity | null> {
    const now = Date.now();
    if (this.cache && now - this.cachedAt < CACHE_TTL_MS) {
      return this.cache;
    }
    if (this.inflight) return this.inflight;

    this.inflight = this.repo
      .findOne({ where: { configKey: MAIN_KEY } })
      .then((row) => {
        this.cache = row;
        this.cachedAt = Date.now();
        return row;
      })
      .catch((e) => {
        this.logger.warn(`AppConfig load failed: ${(e as Error).message}`);
        return this.cache; // serve stale on error
      })
      .finally(() => {
        this.inflight = null;
      });

    return this.inflight;
  }

  /** Force-clears the cache (used by tests / after admin writes if same-process). */
  invalidate(): void {
    this.cache = null;
    this.cachedAt = 0;
  }

  async getOperations(): Promise<OperationsConfig> {
    const row = await this.load();
    return { ...DEFAULT_OPERATIONS, ...(row?.operationsConfig ?? {}) };
  }

  async getPricingRules(): Promise<PricingRulesConfig> {
    const row = await this.load();
    return { ...DEFAULT_PRICING_RULES, ...(row?.pricingRulesConfig ?? {}) };
  }

  async getLoyalty(): Promise<LoyaltyConfig> {
    const row = await this.load();
    return { ...DEFAULT_LOYALTY, ...(row?.loyaltyConfig ?? {}) };
  }

  /**
   * Resolve the active surge multiplier for a region at "now".
   * Returns 1.0 when no rule matches. The first matching rule wins.
   */
  async getSurgeMultiplier(regionId: number, when = new Date()): Promise<number> {
    const { surge } = await this.getPricingRules();
    if (!Array.isArray(surge) || surge.length === 0) return 1;
    const day = when.getDay();
    const hour = when.getHours();
    for (const rule of surge) {
      if (rule.regionId != null && rule.regionId !== regionId) continue;
      if (rule.dayOfWeek != null && rule.dayOfWeek !== day) continue;
      const from = rule.fromHour ?? 0;
      const to = rule.toHour ?? 23;
      const inWindow =
        from <= to ? hour >= from && hour <= to : hour >= from || hour <= to;
      if (inWindow && rule.multiplier > 0) return rule.multiplier;
    }
    return 1;
  }
}
