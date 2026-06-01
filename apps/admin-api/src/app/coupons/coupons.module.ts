import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponEntity } from '@hancr/database';
import { CouponsService } from './coupons.service';
import { CouponsResolver } from './coupons.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([CouponEntity])],
  providers: [CouponsService, CouponsResolver],
  exports: [CouponsService],
})
export class CouponsModule {}
