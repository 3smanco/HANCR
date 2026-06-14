import { Module } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslationProvider } from './translation.provider';
import { TranslationResolver } from './translation.resolver';
import { ScopeModule } from '../scope/scope.module';

/**
 * تحليل لغة المحادثات (تحسين Phase 9) — كشف لغة كل طرف وتعليم الرحلات التي
 * تحتاج ترجمة فورية. النداء الفعلي للترجمة محجوب بمفتاح المالك.
 */
@Module({
  imports: [ScopeModule],
  providers: [TranslationService, TranslationProvider, TranslationResolver],
  exports: [TranslationService, TranslationProvider],
})
export class TranslationModule {}
