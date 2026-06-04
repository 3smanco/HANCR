import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CompanyEntity,
  DriverEntity,
  RiderEntity,
  WalletTransactionEntity,
} from '@hancr/database';
import { WalletModule as HancrWalletModule } from '@hancr/wallet';
import { WalletsService } from './wallets.service';
import { WalletsResolver } from './wallets.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RiderEntity,
      DriverEntity,
      CompanyEntity,
      WalletTransactionEntity,
    ]),
    HancrWalletModule,
  ],
  providers: [WalletsService, WalletsResolver],
  exports: [WalletsService],
})
export class AdminWalletsModule {}
