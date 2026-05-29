import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyEntity } from '@hancr/database';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyResolver } from './loyalty.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyEntity])],
  providers: [LoyaltyService, LoyaltyResolver],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
