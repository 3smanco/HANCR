import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CompanyEntity } from '@hancr/database';
import { CurrencyService } from '../currency/currency.service';
import {
  CompanyCountrySpend,
  CompanyGlobalProfile,
} from './dto/company-global.types';

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface CountrySpendInput {
  countryIso: string | null;
  spentBase: number;
}

/**
 * يلخّص امتداد الشركة من إنفاقها لكل دولة. دالة نقيّة قابلة للاختبار.
 * الشركة متعددة الجنسيات إن كانت نشطة (لها إنفاق) في أكثر من دولة معروفة.
 */
export function summarizeCompanyReach(spends: CountrySpendInput[]): {
  countriesActive: number;
  multinational: boolean;
  totalSpentBase: number;
} {
  const known = spends.filter((s) => s.countryIso && s.spentBase > 0);
  const countries = new Set(known.map((s) => s.countryIso));
  return {
    countriesActive: countries.size,
    multinational: countries.size > 1,
    totalSpentBase: round2(spends.reduce((sum, s) => sum + s.spentBase, 0)),
  };
}

interface SpendRow {
  iso2: string | null;
  nameEn: string | null;
  flag: string | null;
  currency: string | null;
  orders: string;
  spentNative: string;
}

/**
 * CompanyGlobalService — ملف شركة عالمي (MNC). scope-aware.
 */
@Injectable()
export class CompanyGlobalService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,
    private readonly dataSource: DataSource,
    private readonly currency: CurrencyService,
  ) {}

  async companyGlobalProfile(
    companyId: number,
    allowedRegionIds: number[] | null,
  ): Promise<CompanyGlobalProfile> {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException(`Company #${companyId} not found`);

    const params: unknown[] = [companyId];
    let scopeClause = '';
    if (allowedRegionIds) {
      params.push(allowedRegionIds); // $2
      scopeClause = 'AND o.region_id = ANY($2)';
    }

    const rows = await this.dataSource.query<SpendRow[]>(
      `SELECT c.iso2, c.name_en AS "nameEn", c.flag, c.currency,
              COUNT(o.id)::int AS "orders",
              COALESCE(SUM(o.cost_after_coupon), 0) AS "spentNative"
       FROM hancr_order o
       JOIN hancr_region r ON r.id = o.region_id
       LEFT JOIN hancr_country c ON c.id = r.country_id
       WHERE o.company_id = $1 AND o.status = 'Finished' ${scopeClause}
       GROUP BY c.iso2, c.name_en, c.flag, c.currency
       ORDER BY "spentNative" DESC`,
      params,
    );

    const byCountry: CompanyCountrySpend[] = rows.map((r) => {
      const native = Number(r.spentNative);
      const cur = r.currency ?? company.currency;
      return {
        countryIso: r.iso2 ?? undefined,
        countryName: r.nameEn ?? 'غير محدَّد',
        flag: r.flag ?? undefined,
        currency: cur,
        orders: Number(r.orders),
        spentNative: round2(native),
        spentBase: this.currency.toBase(native, cur),
      };
    });

    const reach = summarizeCompanyReach(
      byCountry.map((b) => ({
        countryIso: b.countryIso ?? null,
        spentBase: b.spentBase,
      })),
    );

    return {
      companyId: company.id,
      name: company.name,
      status: company.status,
      currency: company.currency,
      balance: round2(Number(company.balance)),
      totalSpentBase: reach.totalSpentBase,
      baseCurrency: this.currency.baseCurrency,
      countriesActive: reach.countriesActive,
      multinational: reach.multinational,
      byCountry,
    };
  }
}
