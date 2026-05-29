import { Module } from '@nestjs/common';
import { TrackingResolver } from './tracking.resolver';

/**
 * TrackingModule — subscription لتتبع موقع السائق (للراكب).
 *
 * يعتمد على `pubSubProvider` الـ Global في rider-api.module.ts.
 */
@Module({
  providers: [TrackingResolver],
})
export class TrackingModule {}
