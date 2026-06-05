import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AnnouncementEntity,
  GiftBatchEntity,
  GiftCodeEntity,
  RiderEntity,
} from '@hancr/database';
import { WalletModule } from '@hancr/wallet';
import {
  RiderMarketingResolver,
  RiderMarketingService,
} from './rider-marketing.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnnouncementEntity,
      GiftBatchEntity,
      GiftCodeEntity,
      RiderEntity,
    ]),
    WalletModule,
  ],
  providers: [RiderMarketingService, RiderMarketingResolver],
})
export class RiderMarketingModule {}
