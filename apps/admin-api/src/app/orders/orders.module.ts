import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DriverEntity,
  OrderEntity,
  OrderMessageEntity,
  RequestActivityEntity,
  RiderEntity,
  ServiceEntity,
} from '@hancr/database';
import { HancrRedisModule } from '@hancr/redis';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { OrderDetailService } from './order-detail.service';
import { OrderDetailResolver } from './order-detail.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      RequestActivityEntity,
      OrderMessageEntity,
      DriverEntity,
      RiderEntity,
      ServiceEntity,
    ]),
    HancrRedisModule,
  ],
  providers: [
    OrdersService,
    OrdersResolver,
    OrderDetailService,
    OrderDetailResolver,
  ],
  exports: [OrdersService, OrderDetailService],
})
export class OrdersModule {}
