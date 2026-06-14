import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  AdminUserEntity,
  CountryEntity,
  OperatorScope,
  RegionEntity,
} from '@hancr/database';

/** المشغّل الحالي كما يصل من الـ JWT. */
export interface ScopedOperator {
  adminId: number;
  role: string;
}

/** تضييق اختياري قادم من الشريط العلوي (الدولة/المدينة المختارة). */
export interface ScopeRequest {
  countryIso?: string;
  cityId?: number;
}

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ScopeService — RBAC مُنطقَن (Phase 0c)                         ║
 * ║                                                               ║
 * ║  يحوّل نطاق المشغّل (دول/مدن) إلى مجموعة regionIds مسموح بها،    ║
 * ║  مع تضييق اختياري بدولة/مدينة من الشريط العلوي. تستدعيه          ║
 * ║  الـ resolvers لتقييد استعلامات القوائم:                       ║
 * ║    const ids = await scope.allowedRegionIds(op, {countryIso}); ║
 * ║    if (ids) qb.andWhere('region_id IN (:...ids)', { ids });    ║
 * ║  null = عالمي (لا فلتر). role==='super' دائماً عالمي.           ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
@Injectable()
export class ScopeService {
  private cache = new Map<number, { scope: OperatorScope | null; at: number }>();
  private readonly TTL = 60_000;

  constructor(
    @InjectRepository(AdminUserEntity)
    private readonly adminRepo: Repository<AdminUserEntity>,
    @InjectRepository(RegionEntity)
    private readonly regionRepo: Repository<RegionEntity>,
    @InjectRepository(CountryEntity)
    private readonly countryRepo: Repository<CountryEntity>,
  ) {}

  /** نطاق المشغّل من قاعدة البيانات (مُخبّأ 60ث). */
  async getScope(adminId: number): Promise<OperatorScope | null> {
    const c = this.cache.get(adminId);
    if (c && Date.now() - c.at < this.TTL) return c.scope;
    const u = await this.adminRepo.findOne({
      where: { id: adminId },
      select: ['id', 'scope'],
    });
    const scope = u?.scope ?? null;
    this.cache.set(adminId, { scope, at: Date.now() });
    return scope;
  }

  /** يُبطل الكاش عند تغيير نطاق مشغّل. */
  invalidate(adminId: number): void {
    this.cache.delete(adminId);
  }

  isGlobalScope(scope: OperatorScope | null | undefined): boolean {
    return (
      !scope ||
      ((!scope.countries || scope.countries.length === 0) &&
        (!scope.cities || scope.cities.length === 0))
    );
  }

  /**
   * regionIds المسموح بها (null = عالمي). تتقاطع نطاق المشغّل مع طلب الشريط العلوي.
   */
  async allowedRegionIds(
    operator: ScopedOperator,
    req?: ScopeRequest,
  ): Promise<number[] | null> {
    const requested = await this.regionIdsForRequest(req);

    // super أو نطاق عالمي → فقط تضييق الشريط العلوي إن وُجد.
    if (operator.role === 'super') return requested;
    const scope = await this.getScope(operator.adminId);
    if (this.isGlobalScope(scope)) return requested;

    const scoped = await this.regionIdsForScope(scope as OperatorScope);
    if (requested === null) return scoped;
    // تقاطع: ما يسمح به النطاق ∩ ما طلبه الشريط العلوي.
    const set = new Set(requested);
    return scoped.filter((id) => set.has(id));
  }

  private async regionIdsForScope(scope: OperatorScope): Promise<number[]> {
    const ids = new Set<number>();
    if (scope.countries?.length) {
      const countries = await this.countryRepo.find({
        where: { iso2: In(scope.countries.map((c) => c.toUpperCase())) },
        select: ['id'],
      });
      const cids = countries.map((c) => c.id);
      if (cids.length) {
        const regs = await this.regionRepo.find({
          where: { countryId: In(cids) },
          select: ['id'],
        });
        regs.forEach((r) => ids.add(r.id));
      }
    }
    if (scope.cities?.length) {
      const regs = await this.regionRepo.find({
        where: { cityId: In(scope.cities) },
        select: ['id'],
      });
      regs.forEach((r) => ids.add(r.id));
    }
    return [...ids];
  }

  private async regionIdsForRequest(
    req?: ScopeRequest,
  ): Promise<number[] | null> {
    if (!req || (!req.countryIso && !req.cityId)) return null;
    const ids = new Set<number>();
    if (req.cityId) {
      const regs = await this.regionRepo.find({
        where: { cityId: req.cityId },
        select: ['id'],
      });
      regs.forEach((r) => ids.add(r.id));
    } else if (req.countryIso) {
      const country = await this.countryRepo.findOne({
        where: { iso2: req.countryIso.toUpperCase() },
        select: ['id'],
      });
      if (country) {
        const regs = await this.regionRepo.find({
          where: { countryId: country.id },
          select: ['id'],
        });
        regs.forEach((r) => ids.add(r.id));
      }
    }
    return [...ids];
  }
}
