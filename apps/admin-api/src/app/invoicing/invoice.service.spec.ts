import { describe, it, expect } from '@jest/globals';
import { computeInvoice } from './invoice.service';

describe('computeInvoice', () => {
  it('VAT 15% (السعودية) — استخراج شامل', () => {
    // 115 شامل 15% → ضريبة = 115 - 115/1.15 = 15، صافي 100
    const inv = computeInvoice({
      orderId: 1, currency: 'SAR', countryIso: 'SA', countryName: 'Saudi',
      fare: 115, discount: 0, total: 115,
      taxRule: { type: 'VAT', rate: 15 },
    });
    expect(inv.taxAmount).toBe(15);
    expect(inv.net).toBe(100);
    expect(inv.total).toBe(115);
    expect(inv.taxType).toBe('VAT');
  });

  it('NONE (قطر) — لا ضريبة', () => {
    const inv = computeInvoice({
      orderId: 2, currency: 'QAR', countryIso: 'QA', countryName: 'Qatar',
      fare: 50, discount: 0, total: 50,
      taxRule: { type: 'NONE', rate: 0 },
    });
    expect(inv.taxAmount).toBe(0);
    expect(inv.net).toBe(50);
    expect(inv.taxType).toBe('NONE');
  });

  it('خصم يظهر كبند سالب', () => {
    const inv = computeInvoice({
      orderId: 3, currency: 'SAR', countryIso: 'SA', countryName: 'Saudi',
      fare: 120, discount: 5, total: 115,
      taxRule: { type: 'VAT', rate: 15 },
    });
    expect(inv.lines).toEqual([
      { label: 'الأجرة', amount: 120 },
      { label: 'خصم', amount: -5 },
    ]);
    expect(inv.total).toBe(115);
    expect(inv.taxAmount).toBe(15);
  });

  it('بلا قاعدة ضريبة → NONE', () => {
    const inv = computeInvoice({
      orderId: 4, currency: 'USD', countryIso: 'US', countryName: 'US',
      fare: 30, discount: 0, total: 30,
    });
    expect(inv.taxType).toBe('NONE');
    expect(inv.taxAmount).toBe(0);
  });
});
