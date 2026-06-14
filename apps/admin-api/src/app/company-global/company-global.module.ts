import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyEntity } from '@hancr/database';
import { CompanyGlobalService } from './company-global.service';
import { CompanyGlobalResolver } from './company-global.resolver';
import { ScopeModule } from '../scope/scope.module';
import { CurrencyModule } from '../currency/currency.module';

/**
 * بوابة الشركات العالمية (تحسين Phase 9) — ملف MNC: إنفاق المقرّ على رحلات
 * فروعه عبر الدول مدمَجاً بعملة الأساس. مُقيَّد بنطاق المشغّل.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyEntity]),
    ScopeModule,
    CurrencyModule,
  ],
  providers: [CompanyGlobalService, CompanyGlobalResolver],
  exports: [CompanyGlobalService],
})
export class CompanyGlobalModule {}
