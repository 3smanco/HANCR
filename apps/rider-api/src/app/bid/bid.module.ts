import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BidEntity,
  BidOfferEntity,
  DriverEntity,
  OrderEntity,
} from '@hancr/database';
import { BidService } from './bid.service';
import { BidResolver } from './bid.resolver';
import { pubSubProvider } from '../pubsub.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BidEntity,
      BidOfferEntity,
      DriverEntity,
      OrderEntity,
    ]),
  ],
  providers: [BidService, BidResolver, pubSubProvider],
  exports: [BidService],
})
export class BidModule {}
