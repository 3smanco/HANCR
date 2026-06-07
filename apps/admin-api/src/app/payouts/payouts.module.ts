import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DriverEntity,
  PayoutEntryEntity,
  PayoutMethodEntity,
  PayoutSessionEntity,
} from '@hancr/database';
import { WalletModule as HancrWalletModule } from '@hancr/wallet';
import { PayoutsService } from './payouts.service';
import { PayoutsResolver } from './payouts.resolver';
import { PayoutGatewayService } from './payout-gateway.service';
import { PayoutsWebhookController } from './payouts.webhook.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayoutSessionEntity,
      PayoutEntryEntity,
      PayoutMethodEntity,
      DriverEntity,
    ]),
    HancrWalletModule,
  ],
  controllers: [PayoutsWebhookController],
  providers: [PayoutsService, PayoutsResolver, PayoutGatewayService],
  exports: [PayoutsService],
})
export class AdminPayoutsModule {}
