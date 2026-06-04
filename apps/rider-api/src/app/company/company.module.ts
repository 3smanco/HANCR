import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyEmployeeEntity, CompanyEntity } from '@hancr/database';
import { WalletModule } from '@hancr/wallet';
import { CompanyService } from './company.service';
import { CompanyResolver } from './company.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyEntity, CompanyEmployeeEntity]),
    WalletModule,
  ],
  providers: [CompanyService, CompanyResolver],
  exports: [CompanyService],
})
export class CompanyModule {}
