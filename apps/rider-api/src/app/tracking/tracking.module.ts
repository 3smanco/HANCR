import { Module } from '@nestjs/common';
import { TrackingResolver } from './tracking.resolver';
import { pubSubProvider } from '../pubsub.provider';

/**
 * TrackingModule — subscription لتتبع موقع السائق (للراكب).
 */
@Module({
  providers: [TrackingResolver, pubSubProvider],
})
export class TrackingModule {}
