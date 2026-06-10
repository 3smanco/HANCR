import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity, WalletTransactionEntity } from '@hancr/database';
import { DriverToolsService } from './driver-tools.service';
import { DriverToolsResolver } from './driver-tools.resolver';

/** N10 — أدوات السائق (أرباح يومية + heatmap الطلب). */
@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, WalletTransactionEntity])],
  providers: [DriverToolsService, DriverToolsResolver],
})
export class DriverToolsModule {}
