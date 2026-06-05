import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverEntity, FleetEntity } from '@hancr/database';
import { WalletModule } from '@hancr/wallet';
import { FleetsService } from './fleets.service';
import { FleetsResolver } from './fleets.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([FleetEntity, DriverEntity]),
    WalletModule,
  ],
  providers: [FleetsService, FleetsResolver],
  exports: [FleetsService],
})
export class FleetsModule {}
