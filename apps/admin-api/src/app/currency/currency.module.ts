import { Module } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { CurrencyService } from './currency.service';
import { CurrencyResolver } from './currency.resolver';

/**
 * محرك العملات العالمي (Phase 0b) — مزامنة الصرف + تحويل لعرض موحّد.
 * يُصدّر CurrencyService لتستهلكه التحليلات/BI والمالية لاحقاً.
 */
@Module({
  providers: [ExchangeRateService, CurrencyService, CurrencyResolver],
  exports: [ExchangeRateService, CurrencyService],
})
export class CurrencyModule {}
