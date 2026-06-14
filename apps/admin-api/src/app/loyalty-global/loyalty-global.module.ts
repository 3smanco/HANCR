import { Module } from '@nestjs/common';
import { LoyaltyGlobalService } from './loyalty-global.service';
import { LoyaltyGlobalResolver } from './loyalty-global.resolver';
import { CurrencyModule } from '../currency/currency.module';

/**
 * Hancr Miles عالمي (تحسين Phase 8) — نظرة عالمية على برنامج الولاء:
 * توزيع المستويات + التزام الأميال القائمة بعملة الأساس. super فقط.
 */
@Module({
  imports: [CurrencyModule],
  providers: [LoyaltyGlobalService, LoyaltyGlobalResolver],
  exports: [LoyaltyGlobalService],
})
export class LoyaltyGlobalModule {}
