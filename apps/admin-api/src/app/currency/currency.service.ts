import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeRateService } from './exchange-rate.service';

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CurrencyService — تحويل العملات لعرض موحّد                     ║
 * ║                                                               ║
 * ║  يحوّل أي مبلغ بين عملتين عبر أساس USD (من ExchangeRateService). ║
 * ║  عملة العرض الأساسية قابلة للضبط (BASE_DISPLAY_CURRENCY، USD).  ║
 * ║  يُغذّي مصفوفة الأرباح متعددة العملات في الذكاء التجاري.        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
@Injectable()
export class CurrencyService {
  private readonly base: string;

  constructor(
    private readonly fx: ExchangeRateService,
    config: ConfigService,
  ) {
    this.base = (
      config.get<string>('BASE_DISPLAY_CURRENCY') ?? 'USD'
    ).toUpperCase();
  }

  /** عملة العرض الأساسية الموحّدة. */
  get baseCurrency(): string {
    return this.base;
  }

  /** يحوّل مبلغاً من عملة لأخرى (الأسعار لكل 1 USD). */
  convert(amount: number, from: string, to: string): number {
    if (!amount) return 0;
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    if (f === t) return round2(amount);
    const rFrom = this.fx.getRate(f);
    const rTo = this.fx.getRate(t);
    if (!rFrom || !rTo) return round2(amount);
    // amount → USD → to
    return round2((amount / rFrom) * rTo);
  }

  /** يحوّل مبلغاً إلى عملة العرض الأساسية. */
  toBase(amount: number, from: string): number {
    return this.convert(amount, from, this.base);
  }
}
