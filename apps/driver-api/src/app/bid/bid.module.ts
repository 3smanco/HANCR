import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BidEntity, BidOfferEntity } from '@hancr/database';
import { BidResolver } from './bid.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([BidEntity, BidOfferEntity])],
  providers: [BidResolver],
})
export class BidModule {}
