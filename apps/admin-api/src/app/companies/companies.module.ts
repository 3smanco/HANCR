import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CompanyEmployeeEntity,
  CompanyEntity,
  OrderEntity,
  RiderEntity,
} from '@hancr/database';
import { WalletModule } from '@hancr/wallet';
import { CompaniesService } from './companies.service';
import { CompaniesResolver } from './companies.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyEntity,
      CompanyEmployeeEntity,
      RiderEntity,
      OrderEntity,
    ]),
    WalletModule,
  ],
  providers: [CompaniesService, CompaniesResolver],
  exports: [CompaniesService],
})
export class CompaniesModule {}
