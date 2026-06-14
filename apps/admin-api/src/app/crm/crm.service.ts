import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CurrencyService } from '../currency/currency.service';
import {
  CountrySpendType,
  FraudSignalType,
  VipProfileType,
  VipTier,
} from './dto/crm.types';

const round2 = (n: number) => Math.round(n * 100) / 100;

// عتبات المستوى (بعملة الأساس USD افتراضاً) — أيّ شرط يكفي.
const TIER_THRESHOLDS: Array<{ tier: VipTier; spend: number; rides: number }> = [
  { tier: 'platinum', spend: 5000, rides: 500 },
  { tier: 'gold', spend: 1500, rides: 150 },
  { tier: 'silver', spend: 400, rides: 40 },
];

/**
 * يحتسب مستوى VIP عالمياً من الإنفاق المدمَج (عملة الأساس) وعدد الرحلات.
 * دالة نقيّة قابلة للاختبار — أي عتبة (إنفاق أو رحلات) تكفي للترقية.
 */
export function computeVipTier(
  lifetimeSpendBase: number,
  totalRides: number,
): VipTier {
  for (const t of TIER_THRESHOLDS) {
    if (lifetimeSpendBase >= t.spend || totalRides >= t.rides) return t.tier;
  }
  return 'standard';
}

export interface RideEvent {
  orderId: number;
  countryIso: string;
  at: Date;
}

/**
 * كشف احتيال عبر-الحدود (velocity): رحلتان في دولتين مختلفتين خلال نافذة
 * زمنية يستحيل قطعها برّاً → علامة. دالة نقيّة قابلة للاختبار.
 * يقارن كل طلب بالطلبات اللاحقة ضمن النافذة (مُرتَّب زمنياً).
 */
export function detectCrossBorderAnomalies(
  events: RideEvent[],
  windowMinutes = 90,
): FraudSignalType[] {
  const valid = events
    .filter((e) => e.countryIso && e.at)
    .slice()
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const signals: FraudSignalType[] = [];
  const seenPairs = new Set<string>();

  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      const minutesApart =
        (valid[j].at.getTime() - valid[i].at.getTime()) / 60000;
      if (minutesApart > windowMinutes) break; // مُرتَّب → الباقي أبعد
      if (valid[i].countryIso === valid[j].countryIso) continue;
      const key = [valid[i].orderId, valid[j].orderId].sort().join('-');
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      signals.push({
        kind: 'cross_border_velocity',
        severity: minutesApart <= 30 ? 'high' : 'medium',
        orderIdA: valid[i].orderId,
        orderIdB: valid[j].orderId,
        countryA: valid[i].countryIso,
        countryB: valid[j].countryIso,
        minutesApart: round2(minutesApart),
        message: `طلبان في ${valid[i].countryIso} و${valid[j].countryIso} خلال ${round2(
          minutesApart,
        )} دقيقة — يستحيل قطع المسافة برّاً.`,
      });
    }
  }
  return signals;
}

interface SpendRow {
  countryId: number | null;
  iso2: string | null;
  nameEn: string | null;
  flag: string | null;
  currency: string | null;
  orders: string;
  spentNative: string;
}

interface RiderRow {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string;
  email: string | null;
  avatarUrl: string | null;
  banned: boolean;
  rating: string;
  totalRides: number;
  balance: string;
  currency: string;
}

/**
 * CrmService — ملف VIP 360 عالمي + كشف الاحتيال عبر-الحدود.
 * scope-aware: المشغّل المُنطقَن يرى فقط إنفاق الراكب في دوله (allowedRegionIds).
 */
@Injectable()
export class CrmService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly currency: CurrencyService,
  ) {}

  async vipProfile(
    riderId: number,
    allowedRegionIds: number[] | null,
  ): Promise<VipProfileType> {
    const riderRows = await this.dataSource.query<RiderRow[]>(
      `SELECT id, first_name AS "firstName", last_name AS "lastName",
              phone_number AS "phoneNumber", email, avatar_url AS "avatarUrl",
              banned, rating, total_rides AS "totalRides", balance, currency
       FROM hancr_rider WHERE id = $1`,
      [riderId],
    );
    const rider = riderRows[0];
    if (!rider) throw new NotFoundException(`Rider #${riderId} not found`);

    // قيد النطاق: المشغّل المُنطقَن يرى فقط طلبات الراكب داخل مناطقه.
    const scopeClause = allowedRegionIds ? 'AND o.region_id = ANY($2)' : '';
    const spendParams: unknown[] = [riderId];
    if (allowedRegionIds) spendParams.push(allowedRegionIds);

    const spendRows = await this.dataSource.query<SpendRow[]>(
      `SELECT c.id AS "countryId", c.iso2, c.name_en AS "nameEn", c.flag, c.currency,
              COUNT(o.id)::int AS "orders",
              COALESCE(SUM(o.cost_after_coupon), 0) AS "spentNative"
       FROM hancr_order o
       JOIN hancr_region r ON r.id = o.region_id
       LEFT JOIN hancr_country c ON c.id = r.country_id
       WHERE o.rider_id = $1 AND o.status = 'Finished' ${scopeClause}
       GROUP BY c.id, c.iso2, c.name_en, c.flag, c.currency
       ORDER BY "spentNative" DESC`,
      spendParams,
    );

    const byCountry: CountrySpendType[] = spendRows.map((r) => {
      const native = Number(r.spentNative);
      const cur = r.currency ?? rider.currency;
      return {
        countryIso: r.iso2 ?? '—',
        countryName: r.nameEn ?? 'غير محدَّد',
        flag: r.flag ?? undefined,
        currency: cur,
        orders: Number(r.orders),
        spentNative: round2(native),
        spentBase: this.currency.toBase(native, cur),
      };
    });

    const lifetimeSpendBase = round2(
      byCountry.reduce((s, c) => s + c.spentBase, 0),
    );
    const countriesVisited = byCountry.filter((c) => c.countryIso !== '—').length;
    const tier = computeVipTier(lifetimeSpendBase, rider.totalRides);

    // أحدث 200 طلب (دولة + وقت) لفحص الاحتيال عبر-الحدود.
    const eventRows = await this.dataSource.query<
      Array<{ orderId: number; iso2: string | null; at: Date }>
    >(
      `SELECT o.id AS "orderId", c.iso2, o.created_on AS "at"
       FROM hancr_order o
       JOIN hancr_region r ON r.id = o.region_id
       LEFT JOIN hancr_country c ON c.id = r.country_id
       WHERE o.rider_id = $1 ${scopeClause}
       ORDER BY o.created_on DESC LIMIT 200`,
      spendParams,
    );
    const fraudSignals = detectCrossBorderAnomalies(
      eventRows
        .filter((e) => e.iso2)
        .map((e) => ({
          orderId: e.orderId,
          countryIso: e.iso2 as string,
          at: new Date(e.at),
        })),
    );

    return {
      riderId: rider.id,
      name:
        [rider.firstName, rider.lastName].filter(Boolean).join(' ') ||
        `Rider #${rider.id}`,
      phoneNumber: rider.phoneNumber,
      email: rider.email ?? undefined,
      avatarUrl: rider.avatarUrl ?? undefined,
      banned: rider.banned,
      rating: Number(rider.rating),
      tier,
      lifetimeSpendBase,
      baseCurrency: this.currency.baseCurrency,
      totalRides: rider.totalRides,
      countriesVisited,
      walletBalance: round2(Number(rider.balance)),
      walletCurrency: rider.currency,
      byCountry,
      fraudSignals,
    };
  }
}
