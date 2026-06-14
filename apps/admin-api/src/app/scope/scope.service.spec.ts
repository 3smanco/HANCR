import { describe, it, expect } from '@jest/globals';
import { ScopeService } from './scope.service';

// بيانات وهمية
const COUNTRIES = [
  { id: 1, iso2: 'QA' },
  { id: 2, iso2: 'GB' },
];
const REGIONS = [
  { id: 10, countryId: 1, cityId: 100 },
  { id: 11, countryId: 1, cityId: 101 },
  { id: 20, countryId: 2, cityId: 200 },
];

// استخراج قيمة In() (FindOperator يخزّنها في .value) أو القيمة المباشرة.
const v = (x: unknown): unknown =>
  x && typeof x === 'object' && 'value' in (x as object)
    ? (x as { value: unknown }).value
    : x;

function makeService(adminScope: unknown): ScopeService {
  const adminRepo = {
    findOne: async () => ({ id: 1, scope: adminScope }),
  };
  const regionRepo = {
    find: async ({ where }: { where: { countryId?: unknown; cityId?: unknown } }) => {
      if (where.countryId !== undefined) {
        const raw = v(where.countryId);
        const ids = Array.isArray(raw) ? raw : [raw];
        return REGIONS.filter((r) => (ids as number[]).includes(r.countryId)).map((r) => ({ id: r.id }));
      }
      if (where.cityId !== undefined) {
        const raw = v(where.cityId);
        const ids = Array.isArray(raw) ? raw : [raw];
        return REGIONS.filter((r) => (ids as number[]).includes(r.cityId)).map((r) => ({ id: r.id }));
      }
      return [];
    },
  };
  const countryRepo = {
    find: async ({ where }: { where: { iso2?: unknown } }) => {
      const isos = v(where.iso2) as string[];
      return COUNTRIES.filter((c) => isos.includes(c.iso2)).map((c) => ({ id: c.id }));
    },
    findOne: async ({ where }: { where: { iso2?: string } }) =>
      COUNTRIES.find((c) => c.iso2 === where.iso2) ?? null,
  };
  return new ScopeService(
    adminRepo as never,
    regionRepo as never,
    countryRepo as never,
  );
}

describe('ScopeService', () => {
  it('isGlobalScope: null/empty = عالمي', () => {
    const s = makeService(null);
    expect(s.isGlobalScope(null)).toBe(true);
    expect(s.isGlobalScope({})).toBe(true);
    expect(s.isGlobalScope({ countries: [] })).toBe(true);
    expect(s.isGlobalScope({ countries: ['QA'] })).toBe(false);
  });

  it('super بلا طلب → null (عالمي)', async () => {
    const s = makeService(null);
    expect(await s.allowedRegionIds({ adminId: 1, role: 'super' })).toBeNull();
  });

  it('super + طلب دولة QA → مناطق قطر فقط', async () => {
    const s = makeService(null);
    const ids = await s.allowedRegionIds({ adminId: 1, role: 'super' }, { countryIso: 'QA' });
    expect(ids?.sort()).toEqual([10, 11]);
  });

  it('مشغّل بنطاق عالمي بلا طلب → null', async () => {
    const s = makeService(null);
    expect(await s.allowedRegionIds({ adminId: 1, role: 'ops' })).toBeNull();
  });

  it('مشغّل مُنطقَن بقطر → مناطق قطر', async () => {
    const s = makeService({ countries: ['QA'] });
    const ids = await s.allowedRegionIds({ adminId: 1, role: 'ops' });
    expect(ids?.sort()).toEqual([10, 11]);
  });

  it('تقاطع: نطاق قطر + طلب بريطانيا → فارغ', async () => {
    const s = makeService({ countries: ['QA'] });
    const ids = await s.allowedRegionIds({ adminId: 1, role: 'ops' }, { countryIso: 'GB' });
    expect(ids).toEqual([]);
  });

  it('مشغّل مُنطقَن بمدينة → مناطق تلك المدينة', async () => {
    const s = makeService({ cities: [100] });
    const ids = await s.allowedRegionIds({ adminId: 1, role: 'ops' });
    expect(ids).toEqual([10]);
  });
});
