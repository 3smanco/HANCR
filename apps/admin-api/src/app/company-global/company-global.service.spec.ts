import { describe, it, expect } from '@jest/globals';
import { summarizeCompanyReach } from './company-global.service';

describe('summarizeCompanyReach', () => {
  it('متعددة الجنسيات عند الإنفاق في أكثر من دولة', () => {
    const r = summarizeCompanyReach([
      { countryIso: 'SA', spentBase: 100 },
      { countryIso: 'AE', spentBase: 50 },
    ]);
    expect(r.countriesActive).toBe(2);
    expect(r.multinational).toBe(true);
    expect(r.totalSpentBase).toBe(150);
  });

  it('غير متعددة الجنسيات عند دولة واحدة', () => {
    const r = summarizeCompanyReach([{ countryIso: 'SA', spentBase: 100 }]);
    expect(r.countriesActive).toBe(1);
    expect(r.multinational).toBe(false);
  });

  it('تتجاهل الدول المجهولة وعديمة الإنفاق في العدّ', () => {
    const r = summarizeCompanyReach([
      { countryIso: 'SA', spentBase: 100 },
      { countryIso: null, spentBase: 30 },
      { countryIso: 'AE', spentBase: 0 },
    ]);
    expect(r.countriesActive).toBe(1);
    expect(r.multinational).toBe(false);
    // لكن الإجمالي يشمل كل الإنفاق (حتى المجهول الدولة)
    expect(r.totalSpentBase).toBe(130);
  });

  it('قائمة فارغة → أصفار', () => {
    const r = summarizeCompanyReach([]);
    expect(r.countriesActive).toBe(0);
    expect(r.multinational).toBe(false);
    expect(r.totalSpentBase).toBe(0);
  });
});
