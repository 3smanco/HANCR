import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DriverDocumentEntity,
  DriverEntity,
  OrderEntity,
  WalletTransactionEntity,
} from '@hancr/database';
import { DriverDetailService } from './driver-detail.service';
import { DriverDetailResolver } from './driver-detail.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DriverEntity,
      DriverDocumentEntity,
      OrderEntity,
      WalletTransactionEntity,
    ]),
  ],
  providers: [DriverDetailService, DriverDetailResolver],
  exports: [DriverDetailService],
})
export class DriversModule {}
