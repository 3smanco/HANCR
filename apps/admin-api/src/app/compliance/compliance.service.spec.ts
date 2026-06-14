import { describe, it, expect } from '@jest/globals';
import { evaluateDriverCompliance } from './compliance.service';

const NOW = new Date('2026-06-14T00:00:00Z');
const inDays = (n: number) =>
  new Date(NOW.getTime() + n * 86400000);

describe('evaluateDriverCompliance', () => {
  const reqs = ['national_id', 'license'];

  it('compliant — كل المطلوب approved وصالح', () => {
    const r = evaluateDriverCompliance(
      reqs,
      [
        { type: 'national_id', status: 'approved' },
        { type: 'license', status: 'approved', expiresAt: inDays(200) },
      ],
      NOW,
    );
    expect(r.status).toBe('compliant');
    expect(r.missing).toEqual([]);
  });

  it('non_compliant — وثيقة ناقصة', () => {
    const r = evaluateDriverCompliance(
      reqs,
      [{ type: 'national_id', status: 'approved' }],
      NOW,
    );
    expect(r.status).toBe('non_compliant');
    expect(r.missing).toEqual(['license']);
  });

  it('non_compliant — رخصة منتهية', () => {
    const r = evaluateDriverCompliance(
      reqs,
      [
        { type: 'national_id', status: 'approved' },
        { type: 'license', status: 'approved', expiresAt: inDays(-5) },
      ],
      NOW,
    );
    expect(r.status).toBe('non_compliant');
    expect(r.expired).toEqual(['license']);
  });

  it('expiringSoon لا يكسر الامتثال', () => {
    const r = evaluateDriverCompliance(
      reqs,
      [
        { type: 'national_id', status: 'approved' },
        { type: 'license', status: 'approved', expiresAt: inDays(10) },
      ],
      NOW,
    );
    expect(r.status).toBe('compliant');
    expect(r.expiringSoon).toEqual(['license']);
  });

  it('pending — وثيقة قيد المراجعة بلا أسوأ منها', () => {
    const r = evaluateDriverCompliance(
      reqs,
      [
        { type: 'national_id', status: 'approved' },
        { type: 'license', status: 'pending' },
      ],
      NOW,
    );
    expect(r.status).toBe('pending');
  });

  it('rejected يُعامَل كناقص (non_compliant)', () => {
    const r = evaluateDriverCompliance(
      reqs,
      [
        { type: 'national_id', status: 'approved' },
        { type: 'license', status: 'rejected' },
      ],
      NOW,
    );
    expect(r.status).toBe('non_compliant');
    expect(r.missing).toContain('license');
  });

  it('يختار الأفضل عند تعدّد وثائق نفس النوع (approved يتفوّق على rejected)', () => {
    const r = evaluateDriverCompliance(
      ['license'],
      [
        { type: 'license', status: 'rejected' },
        { type: 'license', status: 'approved', expiresAt: inDays(100) },
      ],
      NOW,
    );
    expect(r.status).toBe('compliant');
  });

  it('متطلّبات تكيّفية مختلفة لكل دولة (PCO لندن)', () => {
    const r = evaluateDriverCompliance(
      ['license', 'pco_license', 'dbs_check'],
      [{ type: 'license', status: 'approved' }],
      NOW,
    );
    expect(r.missing).toEqual(['pco_license', 'dbs_check']);
  });

  it('وثيقة إضافية غير مطلوبة تُدرَج للعلم بلا تأثير', () => {
    const r = evaluateDriverCompliance(
      ['license'],
      [
        { type: 'license', status: 'approved' },
        { type: 'insurance', status: 'approved' },
      ],
      NOW,
    );
    expect(r.status).toBe('compliant');
    const extra = r.items.find((i) => i.type === 'insurance');
    expect(extra?.required).toBe(false);
  });
});
