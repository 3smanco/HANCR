import { describe, it, expect } from '@jest/globals';
import { milesLiability, summarizeLoyalty } from './loyalty-global.service';

describe('summarizeLoyalty', () => {
  it('يضمن كل المستويات بالترتيب حتى الفارغة', () => {
    const s = summarizeLoyalty([
      { tier: 'Gold', members: 3, availableMiles: 300 },
      { tier: 'Bronze', members: 10, availableMiles: 50 },
    ]);
    expect(s.tiers.map((t) => t.tier)).toEqual([
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
    ]);
    expect(s.tiers[1].members).toBe(0); // Silver فارغ
  });

  it('يجمع الأعضاء والأميال', () => {
    const s = summarizeLoyalty([
      { tier: 'Bronze', members: 10, availableMiles: 50 },
      { tier: 'Gold', members: 3, availableMiles: 300 },
    ]);
    expect(s.totalMembers).toBe(13);
    expect(s.totalAvailableMiles).toBe(350);
  });

  it('قائمة فارغة → أصفار', () => {
    const s = summarizeLoyalty([]);
    expect(s.totalMembers).toBe(0);
    expect(s.totalAvailableMiles).toBe(0);
    expect(s.tiers).toHaveLength(4);
  });
});

describe('milesLiability', () => {
  it('يحسب قيمة الالتزام', () => {
    expect(milesLiability(10000, 0.01)).toBe(100);
  });
  it('يقرّب لخانتين', () => {
    expect(milesLiability(333, 0.01)).toBe(3.33);
  });
});
