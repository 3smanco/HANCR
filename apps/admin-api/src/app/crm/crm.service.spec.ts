import { describe, it, expect } from '@jest/globals';
import { computeVipTier, detectCrossBorderAnomalies } from './crm.service';

describe('computeVipTier', () => {
  it('platinum بالإنفاق العالي', () => {
    expect(computeVipTier(6000, 10)).toBe('platinum');
  });
  it('platinum بكثرة الرحلات رغم إنفاق منخفض', () => {
    expect(computeVipTier(100, 600)).toBe('platinum');
  });
  it('gold', () => {
    expect(computeVipTier(2000, 20)).toBe('gold');
  });
  it('silver', () => {
    expect(computeVipTier(500, 5)).toBe('silver');
  });
  it('standard للمستخدم الجديد', () => {
    expect(computeVipTier(50, 3)).toBe('standard');
  });
  it('أيّ عتبة تكفي — رحلات silver رغم إنفاق standard', () => {
    expect(computeVipTier(10, 45)).toBe('silver');
  });
});

describe('detectCrossBorderAnomalies', () => {
  const base = new Date('2026-06-14T10:00:00Z');
  const min = (m: number) => new Date(base.getTime() + m * 60000);

  it('يكشف دولتين خلال النافذة (high <30د)', () => {
    const signals = detectCrossBorderAnomalies([
      { orderId: 1, countryIso: 'QA', at: min(0) },
      { orderId: 2, countryIso: 'SA', at: min(20) },
    ]);
    expect(signals).toHaveLength(1);
    expect(signals[0].severity).toBe('high');
    expect(signals[0].countryA).toBe('QA');
    expect(signals[0].countryB).toBe('SA');
  });

  it('medium بين 30 و90 دقيقة', () => {
    const signals = detectCrossBorderAnomalies([
      { orderId: 1, countryIso: 'QA', at: min(0) },
      { orderId: 2, countryIso: 'AE', at: min(60) },
    ]);
    expect(signals).toHaveLength(1);
    expect(signals[0].severity).toBe('medium');
  });

  it('لا إشارة لنفس الدولة', () => {
    const signals = detectCrossBorderAnomalies([
      { orderId: 1, countryIso: 'QA', at: min(0) },
      { orderId: 2, countryIso: 'QA', at: min(10) },
    ]);
    expect(signals).toHaveLength(0);
  });

  it('لا إشارة خارج النافذة (دولتان بفارق يوم)', () => {
    const signals = detectCrossBorderAnomalies([
      { orderId: 1, countryIso: 'QA', at: min(0) },
      { orderId: 2, countryIso: 'SA', at: min(1440) },
    ]);
    expect(signals).toHaveLength(0);
  });

  it('لا يكرّر نفس الزوج', () => {
    const signals = detectCrossBorderAnomalies([
      { orderId: 1, countryIso: 'QA', at: min(0) },
      { orderId: 2, countryIso: 'SA', at: min(15) },
    ]);
    expect(signals).toHaveLength(1);
  });
});
