import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AnnouncementEntity,
  GiftBatchEntity,
  GiftCodeEntity,
  RiderEntity,
} from '@hancr/database';
import { MarketingService } from './marketing.service';
import { MarketingResolver } from './marketing.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AnnouncementEntity,
      GiftBatchEntity,
      GiftCodeEntity,
      RiderEntity,
    ]),
  ],
  providers: [MarketingService, MarketingResolver],
  exports: [MarketingService],
})
export class MarketingModule {}
