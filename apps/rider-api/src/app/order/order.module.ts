import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  OrderEntity,
  RiderEntity,
  ServiceEntity,
  RequestActivityEntity,
  DriverEntity,
  CouponEntity,
} from '@hancr/database';
import { OrderService } from './order.service';
import { OrderResolver } from './order.resolver';
import { MatchingService } from './matching.service';
import { DirectionsService } from './directions.service';
import { CouponService } from './coupon.service';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { BundleModule } from '../bundle/bundle.module';
import { CompanyModule } from '../company/company.module';
import { pubSubProvider } from '../pubsub.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      RiderEntity,
      ServiceEntity,
      RequestActivityEntity,
      DriverEntity,
      CouponEntity,
    ]),
    LoyaltyModule,
    BundleModule,
    CompanyModule,
  ],
  providers: [
    OrderService,
    OrderResolver,
    MatchingService,
    DirectionsService,
    CouponService,
    pubSubProvider,
  ],
  exports: [OrderService, MatchingService],
})
export class OrderModule {}
