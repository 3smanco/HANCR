import { Module } from '@nestjs/common';
import { WalletModule as HancrWalletModule } from '@hancr/wallet';
import { WalletResolver } from './wallet.resolver';
import { WalletWebhookController } from './wallet-webhook.controller';

/**
 * App-level WalletModule — يربط مكتبة @hancr/wallet بـ:
 *   - GraphQL resolver للعمليات من تطبيق الراكب
 *   - REST controller لاستقبال webhooks من بوابات الدفع
 */
@Module({
  imports: [HancrWalletModule],
  providers: [WalletResolver],
  controllers: [WalletWebhookController],
})
export class WalletModule {}
