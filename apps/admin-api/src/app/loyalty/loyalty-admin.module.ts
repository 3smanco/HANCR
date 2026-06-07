import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyEntity } from '@hancr/database';
import { LoyaltyAdminService } from './loyalty-admin.service';
import { LoyaltyAdminResolver } from './loyalty-admin.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyEntity])],
  providers: [LoyaltyAdminService, LoyaltyAdminResolver],
  exports: [LoyaltyAdminService],
})
export class LoyaltyAdminModule {}
