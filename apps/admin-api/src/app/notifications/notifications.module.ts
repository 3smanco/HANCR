import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiderEntity, DriverEntity } from '@hancr/database';
import { BroadcastService } from './broadcast.service';
import { NotificationsResolver } from './notifications.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([RiderEntity, DriverEntity])],
  providers: [BroadcastService, NotificationsResolver],
})
export class AdminNotificationsModule {}
