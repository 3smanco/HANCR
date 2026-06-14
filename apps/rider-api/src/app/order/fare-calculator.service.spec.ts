import { describe, it, expect } from '@jest/globals';
import { FareCalculator } from './fare-calculator.service';

describe('FareCalculator', () => {
  const calc = new FareCalculator();
  // أساس مشترك: 5 ريال + 1.5/كم + 0.3/دقيقة، حد أدنى 10.
  const base = {
    baseFare: 5,
    perKm: 1.5,
    perMinute: 0.3,
    minimumFee: 10,
  };

  it('حساب أساسي: base + مسافة + وقت', () => {
    const f = calc.calculate({
      ...base,
      distanceMeters: 10000, // 10 كم → 15
      durationSeconds: 600, // 10 دقائق → 3
    });
    // 5 + 15 + 3 = 23
    expect(f.subtotal).toBe(23);
    expect(f.total).toBe(23);
    expect(f.minimumApplied).toBe(false);
  });

  it('يفرض الحد الأدنى عند الرحلة القصيرة', () => {
    const f = calc.calculate({
      ...base,
      distanceMeters: 500, // 0.5 كم → 0.75
      durationSeconds: 120, // 2 دقيقة → 0.6
    });
    // 5 + 0.75 + 0.6 = 6.35 < 10 → يُرفع للحد الأدنى
    expect(f.beforeMinimum).toBe(6.35);
    expect(f.total).toBe(10);
    expect(f.minimumApplied).toBe(true);
  });

  it('يطبّق مضاعف المنطقة', () => {
    const f = calc.calculate({
      ...base,
      distanceMeters: 10000,
      durationSeconds: 600,
      zoneMultiplier: 1.5,
    });
    // 23 × 1.5 = 34.5
    expect(f.combinedMultiplier).toBe(1.5);
    expect(f.total).toBe(34.5);
  });

  it('يطبّق مضاعف الذروة الزمني الأعلى فقط (لا تكديس)', () => {
    const now = new Date('2026-06-15T08:00:00'); // 8 صباحاً
    const f = calc.calculate({
      ...base,
      distanceMeters: 10000,
      durationSeconds: 600,
      now,
      serviceMultipliers: {
        time: [
          { startHour: 7, endHour: 9, multiplier: 1.4 }, // ينطبق
          { startHour: 7, endHour: 9, multiplier: 1.2 }, // ينطبق لكن أقل
        ],
      },
    });
    expect(f.peakMultiplier).toBe(1.4); // الأعلى، لا 1.4×1.2
    expect(f.total).toBe(32.2); // 23 × 1.4
  });

  it('يضرب المنطقة × الذروة × surge معاً', () => {
    const now = new Date('2026-06-15T08:00:00');
    const f = calc.calculate({
      ...base,
      distanceMeters: 10000,
      durationSeconds: 600,
      now,
      zoneMultiplier: 1.2,
      surgeMultiplier: 1.5,
      serviceMultipliers: { time: [{ startHour: 7, endHour: 9, multiplier: 1.3 }] },
    });
    // 1.2 × 1.3 × 1.5 = 2.34
    expect(f.combinedMultiplier).toBe(2.34);
    expect(f.total).toBe(53.82); // 23 × 2.34
  });

  it('يطبّق ذروة نهاية الأسبوع حسب اليوم', () => {
    const sunday = new Date('2026-06-14T12:00:00'); // 14 يونيو 2026 = الأحد (day=0)
    const f = calc.calculate({
      ...base,
      distanceMeters: 10000,
      durationSeconds: 600,
      now: sunday,
      serviceMultipliers: { weekday: [{ weekdays: [0, 6], multiplier: 1.25 }] },
    });
    expect(f.peakMultiplier).toBe(1.25);
  });

  it('لا مضاعف خارج نطاق الذروة', () => {
    const noon = new Date('2026-06-15T12:00:00'); // 12 ظهراً، خارج 7-9
    const f = calc.calculate({
      ...base,
      distanceMeters: 10000,
      durationSeconds: 600,
      now: noon,
      serviceMultipliers: { time: [{ startHour: 7, endHour: 9, multiplier: 1.4 }] },
    });
    expect(f.peakMultiplier).toBe(1);
    expect(f.total).toBe(23);
  });
});
