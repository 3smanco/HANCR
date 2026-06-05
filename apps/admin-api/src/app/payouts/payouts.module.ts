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
  providers: [PayoutsService, PayoutsResolver],
  exports: [PayoutsService],
})
export class AdminPayoutsModule {}
