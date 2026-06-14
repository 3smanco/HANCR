import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountryEntity, OrderEntity, RegionEntity } from '@hancr/database';
import { InvoiceService } from './invoice.service';
import { InvoiceResolver } from './invoice.resolver';
import { ScopeModule } from '../scope/scope.module';

/**
 * الفوترة المُوطَّنة (Phase 4) — فواتير تتكيّف مع ضريبة كل دولة.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, RegionEntity, CountryEntity]),
    ScopeModule,
  ],
  providers: [InvoiceService, InvoiceResolver],
  exports: [InvoiceService],
})
export class InvoiceModule {}
