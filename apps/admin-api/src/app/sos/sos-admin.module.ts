import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SosIncidentEntity } from '@hancr/database';
import { SosAdminService } from './sos-admin.service';
import { SosAdminResolver } from './sos-admin.resolver';
import { pubSubProvider } from '../pubsub.provider';

/**
 * SosAdminModule — endpoints الأدمن + subscription للحوادث الحيَّة.
 */
@Module({
  imports: [TypeOrmModule.forFeature([SosIncidentEntity])],
  providers: [SosAdminService, SosAdminResolver, pubSubProvider],
})
export class SosAdminModule {}
