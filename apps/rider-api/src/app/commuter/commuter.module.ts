import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommuterSubscriptionEntity } from '@hancr/database';
import { CommuterService } from './commuter.service';
import { CommuterResolver } from './commuter.resolver';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommuterSubscriptionEntity]),
    OrderModule, // لاستخدام OrderService.createOrder من الكرون
  ],
  providers: [CommuterService, CommuterResolver],
})
export class CommuterModule {}
