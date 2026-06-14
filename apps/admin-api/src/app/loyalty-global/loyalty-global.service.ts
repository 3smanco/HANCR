import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CurrencyService } from '../currency/currency.service';
import {
  GlobalLoyaltyOverview,
  TierBucket,
} from './dto/loyalty-global.types';

const round2 = (n: number) => Math.round(n * 100) / 100;

// قيمة الميل الواحد بعملة الأساس (USD افتراضاً). قابلة للضبط عبر البيئة.
const DEFAULT_MILE_VALUE_USD = 0.01;

const TIER_ORDER = ['Bronze', 'Silver', 'Gold', 'Platinum'];

export interface LoyaltyRow {
  tier: string;
  members: number;
  availableMiles: number;
}

/**
 * يلخّص صفوف الولاء إلى توزيع مستويات مُرتَّب + إجماليات. دالة نقيّة قابلة للاختبار.
 * يضمن ظهور كل المستويات (حتى الفارغة) بالترتيب الصحيح.
 */
export function summarizeLoyalty(rows: LoyaltyRow[]): {
  tiers: TierBucket[];
  totalMembers: number;
  totalAvailableMiles: number;
} {
  const byTier = new Map<string, LoyaltyRow>();
  for (const r of rows) byTier.set(r.tier, r);

  const tiers: TierBucket[] = TIER_ORDER.map((tier) => {
    const r = byTier.get(tier);
    return {
      tier,
      members: r ? Number(r.members) : 0,
      availableMiles: r ? round2(Number(r.availableMiles)) : 0,
    };
  });

  return {
    tiers,
    totalMembers: tiers.reduce((s, t) => s + t.members, 0),
    totalAvailableMiles: round2(
      tiers.reduce((s, t) => s + t.availableMiles, 0),
    ),
  };
}

/**
 * يحسب التزام الأميال القائمة (قيمة الاستبدال) من إجمالي الأميال وقيمة الميل.
 * دالة نقيّة قابلة للاختبار.
 */
export function milesLiability(totalMiles: number, mileValue: number): number {
  return round2(totalMiles * mileValue);
}

/**
 * LoyaltyGlobalService — نظرة عالمية على برنامج Hancr Miles (super فقط).
 * البرنامج عالمي (الأميال مُستبدَلة عبر الدول) فلا يُجزَّأ بالنطاق.
 */
@Injectable()
export class LoyaltyGlobalService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly currency: CurrencyService,
  ) {}

  async globalOverview(): Promise<GlobalLoyaltyOverview> {
    const rows = await this.dataSource.query<LoyaltyRow[]>(
      `SELECT tier,
              COUNT(*)::int AS members,
              COALESCE(SUM(available_miles), 0) AS "availableMiles"
       FROM hancr_loyalty
       GROUP BY tier`,
    );

    const summary = summarizeLoyalty(rows);

    const mileValueUsd =
      Number(process.env.MILE_VALUE_USD) || DEFAULT_MILE_VALUE_USD;
    // قيمة الميل بعملة الأساس (تحويل من USD).
    const mileValueBase = this.currency.toBase(mileValueUsd, 'USD');
    const liabilityBase = milesLiability(
      summary.totalAvailableMiles,
      mileValueBase,
    );

    return {
      totalMembers: summary.totalMembers,
      tiers: summary.tiers,
      totalAvailableMiles: summary.totalAvailableMiles,
      liabilityBase,
      baseCurrency: this.currency.baseCurrency,
      mileValueBase,
    };
  }
}
