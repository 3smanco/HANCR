import { describe, it, expect } from '@jest/globals';
import { evaluateCoupon, CouponRules } from './growth.service';

const NOW = new Date('2026-06-14T00:00:00Z');
const base: CouponRules = {
  type: 'Percent',
  value: 20,
  maxDiscount: 0,
  minFare: 0,
  maxUses: 0,
  usedCount: 0,
  perUserLimit: 0,
  regionIds: [],
  expiresAt: null,
  active: true,
};

describe('evaluateCoupon', () => {
  it('نسبة 20% بلا سقف', () => {
    const r = evaluateCoupon(base, { regionId: 1, fare: 100, now: NOW });
    expect(r.valid).toBe(true);
    expect(r.discount).toBe(20);
  });

  it('سقف الخصم يُطبَّق', () => {
    const r = evaluateCoupon(
      { ...base, maxDiscount: 15 },
      { regionId: 1, fare: 100, now: NOW },
    );
    expect(r.discount).toBe(15);
  });

  it('مبلغ ثابت لا يتجاوز الأجرة', () => {
    const r = evaluateCoupon(
      { ...base, type: 'Fixed', value: 50 },
      { regionId: 1, fare: 30, now: NOW },
    );
    expect(r.discount).toBe(30);
  });

  it('سياج جغرافي يرفض منطقة خارجه', () => {
    const r = evaluateCoupon(
      { ...base, regionIds: [2, 3] },
      { regionId: 1, fare: 100, now: NOW },
    );
    expect(r.valid).toBe(false);
    expect(r.reason).toBe('region');
  });

  it('سياج جغرافي يقبل منطقة داخله', () => {
    const r = evaluateCoupon(
      { ...base, regionIds: [1, 2] },
      { regionId: 1, fare: 100, now: NOW },
    );
    expect(r.valid).toBe(true);
  });

  it('منتهٍ يُرفَض', () => {
    const r = evaluateCoupon(
      { ...base, expiresAt: new Date('2026-06-13T00:00:00Z') },
      { regionId: 1, fare: 100, now: NOW },
    );
    expect(r.reason).toBe('expired');
  });

  it('أقل أجرة', () => {
    const r = evaluateCoupon(
      { ...base, minFare: 50 },
      { regionId: 1, fare: 40, now: NOW },
    );
    expect(r.reason).toBe('min_fare');
  });

  it('حد الاستخدام الكلّي', () => {
    const r = evaluateCoupon(
      { ...base, maxUses: 100, usedCount: 100 },
      { regionId: 1, fare: 100, now: NOW },
    );
    expect(r.reason).toBe('max_uses');
  });

  it('حد الاستخدام لكل راكب', () => {
    const r = evaluateCoupon(
      { ...base, perUserLimit: 1 },
      { regionId: 1, fare: 100, now: NOW, userUses: 1 },
    );
    expect(r.reason).toBe('per_user_limit');
  });

  it('معطّل يُرفَض', () => {
    const r = evaluateCoupon(
      { ...base, active: false },
      { regionId: 1, fare: 100, now: NOW },
    );
    expect(r.reason).toBe('inactive');
  });
});
