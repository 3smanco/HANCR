import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverApplicationEntity } from '@hancr/database';
import { DriverApplicationsService } from './driver-applications.service';
import { DriverApplicationsResolver } from './driver-applications.resolver';
import { ApplicationUploadUrlService } from './application-upload-url.service';

@Module({
  imports: [TypeOrmModule.forFeature([DriverApplicationEntity])],
  providers: [
    DriverApplicationsService,
    DriverApplicationsResolver,
    ApplicationUploadUrlService,
  ],
  exports: [DriverApplicationsService],
})
export class DriverApplicationsModule {}
