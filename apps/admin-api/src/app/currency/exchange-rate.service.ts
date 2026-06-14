import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * أسعار صرف احتياطية (لكل 1 USD) — تُستخدم عند غياب مفتاح OXR أو فشل الجلب.
 * قيم تقريبية؛ تُحدَّث حيّاً عبر Open Exchange Rates عند توفّر المفتاح.
 */
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, QAR: 3.64, SAR: 3.75, AED: 3.6725, KWD: 0.307, BHD: 0.376,
  OMR: 0.3845, EGP: 49.5, JOD: 0.709, GBP: 0.785, EUR: 0.92, TRY: 34.2,
};

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ExchangeRateService — مزامنة أسعار الصرف (أساس USD)           ║
 * ║                                                               ║
 * ║  يجلب من Open Exchange Rates (إن وُجد OPEN_EXCHANGE_RATES_APP_ID)║
 * ║  كل 6 ساعات + عند الإقلاع، ويحتفظ بها في الذاكرة. عند الفشل     ║
 * ║  أو غياب المفتاح يسقط لجدول احتياطي ثابت. الأسعار "لكل 1 USD".   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
@Injectable()
export class ExchangeRateService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeRateService.name);
  private rates: Record<string, number> = { ...FALLBACK_RATES };
  private lastSync: Date | null = null;
  private source: 'live' | 'fallback' = 'fallback';
  private readonly appId?: string;
  readonly base = 'USD';

  constructor(config: ConfigService) {
    this.appId = config.get<string>('OPEN_EXCHANGE_RATES_APP_ID');
  }

  async onModuleInit(): Promise<void> {
    await this.refresh();
  }

  /** تحديث دوري كل 6 ساعات. */
  @Cron(CronExpression.EVERY_6_HOURS)
  async refresh(): Promise<void> {
    if (!this.appId) {
      this.source = 'fallback';
      return;
    }
    try {
      const res = await fetch(
        `https://openexchangerates.org/api/latest.json?app_id=${this.appId}`,
      );
      if (!res.ok) throw new Error(`OXR HTTP ${res.status}`);
      const data = (await res.json()) as { rates?: Record<string, number> };
      if (data?.rates && Object.keys(data.rates).length > 0) {
        this.rates = data.rates;
        this.lastSync = new Date();
        this.source = 'live';
        this.logger.log(
          `FX rates synced (${Object.keys(this.rates).length} currencies).`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `FX refresh failed (${(e as Error).message}) — using ${this.source} rates.`,
      );
    }
  }

  /** خريطة الأسعار (currency → سعر لكل 1 USD). */
  getRates(): Record<string, number> {
    return { ...this.rates };
  }

  /** سعر عملة لكل 1 USD (1 إن غير معروفة). */
  getRate(currency: string): number {
    return this.rates[currency.toUpperCase()] ?? 1;
  }

  /** بيانات وصفية للعرض (آخر مزامنة، المصدر، العدد). */
  meta(): { base: string; lastSync: Date | null; source: string; count: number } {
    return {
      base: this.base,
      lastSync: this.lastSync,
      source: this.source,
      count: Object.keys(this.rates).length,
    };
  }
}
