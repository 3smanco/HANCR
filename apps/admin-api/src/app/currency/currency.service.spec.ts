import { describe, it, expect } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { ExchangeRateService } from './exchange-rate.service';
import { CurrencyService } from './currency.service';

function cfg(values: Record<string, string>): ConfigService {
  return { get: (k: string) => values[k] } as unknown as ConfigService;
}

describe('CurrencyService', () => {
  // بلا OPEN_EXCHANGE_RATES_APP_ID → أسعار احتياطية ثابتة (USD=1, QAR=3.64, SAR=3.75, AED=3.6725).
  const fx = new ExchangeRateService(cfg({}));
  const currency = new CurrencyService(fx, cfg({ BASE_DISPLAY_CURRENCY: 'USD' }));

  it('نفس العملة تُرجع نفس المبلغ', () => {
    expect(currency.convert(100, 'USD', 'USD')).toBe(100);
  });

  it('QAR → USD', () => {
    // 364 / 3.64 = 100
    expect(currency.convert(364, 'QAR', 'USD')).toBeCloseTo(100, 1);
  });

  it('USD → QAR', () => {
    expect(currency.convert(100, 'USD', 'QAR')).toBeCloseTo(364, 0);
  });

  it('تحويل متقاطع SAR → AED عبر USD', () => {
    // 375/3.75 = 100 USD × 3.6725 = 367.25 AED
    expect(currency.convert(375, 'SAR', 'AED')).toBeCloseTo(367.25, 0);
  });

  it('toBase يستخدم عملة العرض الأساسية', () => {
    expect(currency.toBase(364, 'QAR')).toBeCloseTo(100, 1);
  });

  it('عملة غير معروفة → السعر 1 (لا انهيار)', () => {
    expect(currency.convert(100, 'XXX', 'USD')).toBe(100);
  });

  it('baseCurrency افتراضي USD', () => {
    expect(currency.baseCurrency).toBe('USD');
  });
});
