import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigEntity, DriverEntity, OrderEntity } from '@hancr/database';
import { AdminNotificationsModule } from '../notifications/notifications.module';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceResolver } from './intelligence.resolver';

/** N11 — ذكاء اللوحة: surge engine + الحملات المجدولة. */
@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, DriverEntity, AppConfigEntity]),
    AdminNotificationsModule,
  ],
  providers: [IntelligenceService, IntelligenceResolver],
})
export class IntelligenceModule {}
