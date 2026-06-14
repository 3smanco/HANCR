import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CurrencyService } from '../currency/currency.service';
import { ExchangeRateService } from '../currency/exchange-rate.service';
import {
  CountryLiveStats,
  CountryRevenue,
  GlobalLiveOverview,
  GlobalRevenueMatrix,
} from './dto/global-ops.types';

const round2 = (n: number) => Math.round(n * 100) / 100;

// طلبات "قيد التنفيذ" (غير منتهية/ملغاة).
const ACTIVE_ORDER = [
  'Requested', 'Found', 'DriverAccepted', 'WaitingForPrePay',
  'Arrived', 'Started', 'WaitingForPostPay', 'WaitingForReview', 'Booked',
];
const ACTIVE_DRIVER = ['Online', 'Busy'];

interface Row {
  countryId: number;
  iso2: string;
  name: string;
  nameEn: string;
  flag: string | null;
  currency: string;
  timezone: string;
  enabled: boolean;
  centerLat: string | null;
  centerLng: string | null;
  activeOrders: number;
  onlineDrivers: number;
}

/**
 * GlobalOpsService — يجمّع العمليات الحيّة لكل دولة مُفعَّلة (Geo-Radar).
 * scope-aware: المشغّل المُنطقَن يرى دوله فقط (allowedRegionIds من ScopeService).
 */
@Injectable()
export class GlobalOpsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly currency: CurrencyService,
    private readonly fx: ExchangeRateService,
  ) {}

  async globalLiveOverview(
    allowedRegionIds: number[] | null,
  ): Promise<GlobalLiveOverview> {
    const params: unknown[] = [ACTIVE_ORDER, ACTIVE_DRIVER];
    let regionClause = '';
    let countryClause = 'c.enabled = true';
    if (allowedRegionIds) {
      params.push(allowedRegionIds); // $3
      regionClause = 'AND r.id = ANY($3)';
      countryClause =
        'c.enabled = true AND c.id IN (SELECT country_id FROM hancr_region WHERE id = ANY($3) AND country_id IS NOT NULL)';
    }

    const rows = await this.dataSource.query<Row[]>(
      `SELECT
         c.id AS "countryId", c.iso2, c.name, c.name_en AS "nameEn", c.flag,
         c.currency, c.timezone, c.enabled,
         cc.center_lat AS "centerLat", cc.center_lng AS "centerLng",
         COALESCE(o.cnt, 0)::int AS "activeOrders",
         COALESCE(d.cnt, 0)::int AS "onlineDrivers"
       FROM hancr_country c
       LEFT JOIN LATERAL (
         SELECT center_lat, center_lng FROM hancr_city
         WHERE country_id = c.id AND center_lat IS NOT NULL
         ORDER BY enabled DESC, id ASC LIMIT 1
       ) cc ON true
       LEFT JOIN (
         SELECT r.country_id, COUNT(*) AS cnt
         FROM hancr_order o JOIN hancr_region r ON r.id = o.region_id
         WHERE o.status = ANY($1) ${regionClause}
         GROUP BY r.country_id
       ) o ON o.country_id = c.id
       LEFT JOIN (
         SELECT r.country_id, COUNT(*) AS cnt
         FROM hancr_driver dr JOIN hancr_region r ON r.id = dr.region_id
         WHERE dr.status = ANY($2) ${regionClause}
         GROUP BY r.country_id
       ) d ON d.country_id = c.id
       WHERE ${countryClause}
       ORDER BY "activeOrders" DESC, c.name_en ASC`,
      params,
    );

    const countries: CountryLiveStats[] = rows.map((r) => ({
      countryId: r.countryId,
      iso2: r.iso2,
      name: r.name,
      nameEn: r.nameEn,
      flag: r.flag ?? undefined,
      currency: r.currency,
      timezone: r.timezone,
      centerLat: r.centerLat != null ? Number(r.centerLat) : undefined,
      centerLng: r.centerLng != null ? Number(r.centerLng) : undefined,
      enabled: r.enabled,
      onlineDrivers: Number(r.onlineDrivers),
      activeOrders: Number(r.activeOrders),
    }));

    return {
      countries,
      totalOnlineDrivers: countries.reduce((s, c) => s + c.onlineDrivers, 0),
      totalActiveOrders: countries.reduce((s, c) => s + c.activeOrders, 0),
      activeCountries: countries.filter(
        (c) => c.onlineDrivers > 0 || c.activeOrders > 0,
      ).length,
    };
  }

  /**
   * مصفوفة الأرباح متعددة العملات — أرباح كل دولة بعملتها + محوَّلة لعملة الأساس
   * (CurrencyService) + نموّ مقابل الفترة السابقة. scope-aware.
   */
  async globalRevenueMatrix(
    days: number,
    allowedRegionIds: number[] | null,
  ): Promise<GlobalRevenueMatrix> {
    const d = Math.max(1, Math.min(Math.floor(days) || 30, 365));
    const params: unknown[] = [d];
    let regionClause = '';
    let countryClause = 'c.enabled = true';
    if (allowedRegionIds) {
      params.push(allowedRegionIds); // $2
      regionClause = 'AND r.id = ANY($2)';
      countryClause =
        'c.enabled = true AND c.id IN (SELECT country_id FROM hancr_region WHERE id = ANY($2) AND country_id IS NOT NULL)';
    }

    const cur = `o.created_on >= NOW() - (($1::text) || ' days')::interval`;
    const prev = `o.created_on >= NOW() - ((($1*2)::text) || ' days')::interval AND o.created_on < NOW() - (($1::text) || ' days')::interval`;

    const rows = await this.dataSource.query<
      Array<{
        countryId: number;
        iso2: string;
        name: string;
        nameEn: string;
        flag: string | null;
        currency: string;
        orders: number;
        revenueNative: string;
        platformNative: string;
        revenuePrev: string;
      }>
    >(
      `SELECT
         c.id AS "countryId", c.iso2, c.name, c.name_en AS "nameEn", c.flag, c.currency,
         COUNT(o.id) FILTER (WHERE ${cur})::int AS "orders",
         COALESCE(SUM(o.cost_best) FILTER (WHERE ${cur}), 0) AS "revenueNative",
         COALESCE(SUM(o.provider_share) FILTER (WHERE ${cur}), 0) AS "platformNative",
         COALESCE(SUM(o.cost_best) FILTER (WHERE ${prev}), 0) AS "revenuePrev"
       FROM hancr_country c
       LEFT JOIN hancr_region r ON r.country_id = c.id ${regionClause}
       LEFT JOIN hancr_order o ON o.region_id = r.id AND o.status = 'Finished'
         AND o.created_on >= NOW() - ((($1*2)::text) || ' days')::interval
       WHERE ${countryClause}
       GROUP BY c.id, c.iso2, c.name, c.name_en, c.flag, c.currency
       ORDER BY "revenueNative" DESC`,
      params,
    );

    const countries: CountryRevenue[] = rows.map((r) => {
      const revNative = Number(r.revenueNative);
      const platNative = Number(r.platformNative);
      const revPrev = Number(r.revenuePrev);
      return {
        countryId: r.countryId,
        iso2: r.iso2,
        name: r.name,
        nameEn: r.nameEn,
        flag: r.flag ?? undefined,
        currency: r.currency,
        orders: Number(r.orders),
        revenueNative: round2(revNative),
        revenueBase: this.currency.toBase(revNative, r.currency),
        platformNative: round2(platNative),
        platformBase: this.currency.toBase(platNative, r.currency),
        growthPct:
          revPrev > 0 ? round2(((revNative - revPrev) / revPrev) * 100) : 0,
      };
    });

    const meta = this.fx.meta();
    return {
      countries,
      baseCurrency: this.currency.baseCurrency,
      totalRevenueBase: round2(
        countries.reduce((s, c) => s + c.revenueBase, 0),
      ),
      totalPlatformBase: round2(
        countries.reduce((s, c) => s + c.platformBase, 0),
      ),
      periodDays: d,
      fxSource: meta.source,
      fxLastSync: meta.lastSync ?? undefined,
    };
  }
}
