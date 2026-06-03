import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlightTrackingEntity } from '@hancr/database';
import { FlightService } from './flight.service';
import { FlightResolver } from './flight.resolver';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [TypeOrmModule.forFeature([FlightTrackingEntity]), OrderModule],
  providers: [FlightService, FlightResolver],
})
export class FlightModule {}
