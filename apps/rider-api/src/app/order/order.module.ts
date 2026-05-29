import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  OrderEntity,
  RiderEntity,
  ServiceEntity,
  RequestActivityEntity,
  DriverEntity,
} from '@hancr/database';
import { OrderService } from './order.service';
import { OrderResolver } from './order.resolver';
import { MatchingService } from './matching.service';
import { pubSubProvider } from '../pubsub.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      RiderEntity,
      ServiceEntity,
      RequestActivityEntity,
      DriverEntity,
    ]),
  ],
  providers: [
    OrderService,
    OrderResolver,
    MatchingService,
    pubSubProvider,
  ],
  exports: [OrderService, MatchingService],
})
export class OrderModule {}
