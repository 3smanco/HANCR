import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  OrderEntity,
  DriverEntity,
  RiderEntity,
  RequestActivityEntity,
} from '@hancr/database';
import { OrderService } from './order.service';
import { OrderResolver } from './order.resolver';
import { pubSubProvider } from '../pubsub.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      DriverEntity,
      RiderEntity,
      RequestActivityEntity,
    ]),
  ],
  providers: [OrderService, OrderResolver, pubSubProvider],
  exports: [OrderService],
})
export class OrderModule {}
