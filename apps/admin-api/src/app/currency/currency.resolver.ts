import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { ExchangeRateService } from './exchange-rate.service';
import { CurrencyService } from './currency.service';
import { ExchangeRatesType } from './dto/currency.types';

@Resolver()
export class CurrencyResolver {
  constructor(
    private readonly fx: ExchangeRateService,
    private readonly currency: CurrencyService,
  ) {}

  /** أسعار الصرف الحالية + بيانات المزامنة (لمصفوفة الأرباح ومبدّل العملة). */
  @Query(() => ExchangeRatesType, {
    description: 'أسعار الصرف الحالية ومصدرها وآخر مزامنة',
  })
  @UseGuards(AdminJwtGuard)
  exchangeRates(): ExchangeRatesType {
    const m = this.fx.meta();
    const rates = this.fx.getRates();
    return {
      base: m.base,
      displayBase: this.currency.baseCurrency,
      source: m.source,
      lastSync: m.lastSync ?? undefined,
      count: m.count,
      rates: Object.entries(rates)
        .map(([currency, rate]) => ({ currency, rate }))
        .sort((a, b) => a.currency.localeCompare(b.currency)),
    };
  }
}
