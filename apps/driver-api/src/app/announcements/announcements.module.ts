import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnouncementEntity } from '@hancr/database';
import {
  AnnouncementsResolver,
  AnnouncementsService,
} from './announcements.resolver';

/** إعلانات/أخبار السائق (تُنشأ من لوحة التحكم، target: all|driver). */
@Module({
  imports: [TypeOrmModule.forFeature([AnnouncementEntity])],
  providers: [AnnouncementsService, AnnouncementsResolver],
})
export class AnnouncementsModule {}
