import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { CouponEntity, CouponType } from '@hancr/database';
import { OfferReachType, OfferSimulationType } from './dto/growth.types';

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface CouponRules {
  type: CouponType | 'Percent' | 'Fixed';
  value: number;
  maxDiscount: number;
  minFare: number;
  maxUses: number;
  usedCount: number;
  perUserLimit: number;
  regionIds: number[];
  expiresAt?: Date | null;
  active: boolean;
}

export interface OfferContext {
  regionId: number;
  fare: number;
  now: Date;
  userUses?: number; // كم مرّة استخدمها هذا الراكب
}

/**
 * يقيّم كوبوناً مُسوَّراً جغرافياً مقابل طلب افتراضي. دالة نقيّة قابلة للاختبار.
 * يفحص (بالترتيب): التفعيل، الانتهاء، السياج الجغرافي، أقل أجرة، حدود الاستخدام.
 * ثم يحسب الخصم (نسبة بسقف أو مبلغ ثابت، لا يتجاوز الأجرة).
 */
export function evaluateCoupon(
  coupon: CouponRules,
  ctx: OfferContext,
): { valid: boolean; discount: number; reason?: string } {
  if (!coupon.active) return { valid: false, discount: 0, reason: 'inactive' };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < ctx.now.getTime()) {
    return { valid: false, discount: 0, reason: 'expired' };
  }
  // سياج جغرافي: فارغ = كل المناطق.
  if (
    coupon.regionIds.length > 0 &&
    !coupon.regionIds.includes(ctx.regionId)
  ) {
    return { valid: false, discount: 0, reason: 'region' };
  }
  if (coupon.minFare > 0 && ctx.fare < coupon.minFare) {
    return { valid: false, discount: 0, reason: 'min_fare' };
  }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, discount: 0, reason: 'max_uses' };
  }
  if (
    coupon.perUserLimit > 0 &&
    (ctx.userUses ?? 0) >= coupon.perUserLimit
  ) {
    return { valid: false, discount: 0, reason: 'per_user_limit' };
  }

  let discount: number;
  if (String(coupon.type) === 'Percent') {
    discount = (ctx.fare * coupon.value) / 100;
    if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = coupon.value;
  }
  discount = round2(Math.min(discount, ctx.fare)); // لا يتجاوز الأجرة
  return { valid: true, discount };
}

interface RegionCountryRow {
  regionId: number;
  iso2: string | null;
  nameEn: string | null;
  currency: string | null;
}

/**
 * GrowthService — محاكاة العروض المُسوَّرة جغرافياً + تغطيتها. scope-aware.
 */
@Injectable()
export class GrowthService {
  constructor(
    @InjectRepository(CouponEntity)
    private readonly couponRepo: Repository<CouponEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async simulateOffer(
    code: string,
    regionId: number,
    fare: number,
    allowedRegionIds: number[] | null,
  ): Promise<OfferSimulationType> {
    if (allowedRegionIds && !allowedRegionIds.includes(regionId)) {
      throw new ForbiddenException('هذه المنطقة خارج نطاقك');
    }
    const coupon = await this.couponRepo.findOne({
      where: { code: code.trim().toUpperCase() },
    });
    if (!coupon) throw new NotFoundException(`الكوبون ${code} غير موجود`);

    const rows = await this.dataSource.query<RegionCountryRow[]>(
      `SELECT r.id AS "regionId", c.iso2, c.name_en AS "nameEn", c.currency
       FROM hancr_region r LEFT JOIN hancr_country c ON c.id = r.country_id
       WHERE r.id = $1`,
      [regionId],
    );
    const rc = rows[0];

    const res = evaluateCoupon(coupon, { regionId, fare, now: new Date() });
    return {
      code: coupon.code,
      valid: res.valid,
      reason: res.reason,
      discount: res.discount,
      finalFare: round2(Math.max(0, fare - res.discount)),
      currency: rc?.currency ?? '',
      countryIso: rc?.iso2 ?? undefined,
      countryName: rc?.nameEn ?? undefined,
    };
  }

  async offerReach(
    code: string,
    allowedRegionIds: number[] | null,
  ): Promise<OfferReachType> {
    const coupon = await this.couponRepo.findOne({
      where: { code: code.trim().toUpperCase() },
    });
    if (!coupon) throw new NotFoundException(`الكوبون ${code} غير موجود`);

    const targeted = coupon.regionIds ?? [];
    // ضِمن النطاق فقط: المشغّل المُنطقَن يرى الدول داخل نطاقه.
    let effective = targeted;
    if (allowedRegionIds) {
      effective =
        targeted.length === 0
          ? allowedRegionIds
          : targeted.filter((r) => allowedRegionIds.includes(r));
    }

    let countries: string[] = [];
    if (effective.length > 0) {
      const rows = await this.dataSource.query<Array<{ iso2: string }>>(
        `SELECT DISTINCT c.iso2 FROM hancr_region r
         JOIN hancr_country c ON c.id = r.country_id
         WHERE r.id = ANY($1) AND c.iso2 IS NOT NULL
         ORDER BY c.iso2`,
        [effective],
      );
      countries = rows.map((r) => r.iso2);
    }

    return {
      code: coupon.code,
      global: targeted.length === 0,
      regionCount: targeted.length,
      countries,
    };
  }
}
