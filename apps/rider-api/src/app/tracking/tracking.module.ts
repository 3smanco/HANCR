import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '@hancr/database';
import { TrackingResolver } from './tracking.resolver';
import { pubSubProvider } from '../pubsub.provider';

/**
 * TrackingModule — subscription لتتبع موقع السائق (للراكب).
 */
@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  providers: [TrackingResolver, pubSubProvider],
})
export class TrackingModule {}
