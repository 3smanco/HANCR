import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverEntity } from '@hancr/database';
import { LocationService } from './location.service';
import { LocationResolver } from './location.resolver';
import { pubSubProvider } from '../pubsub.provider';

@Module({
  imports: [TypeOrmModule.forFeature([DriverEntity])],
  providers: [LocationService, LocationResolver, pubSubProvider],
  exports: [LocationService],
})
export class LocationModule {}
