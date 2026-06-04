import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideBundleEntity, RiderEntitlementEntity } from '@hancr/database';
import { WalletModule } from '@hancr/wallet';
import { BundleService } from './bundle.service';
import { BundleResolver } from './bundle.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([RideBundleEntity, RiderEntitlementEntity]),
    WalletModule,
  ],
  providers: [BundleService, BundleResolver],
  exports: [BundleService],
})
export class BundleModule {}
