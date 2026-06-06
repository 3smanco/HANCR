import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverDocumentEntity, DriverEntity } from '@hancr/database';
import { DriverService } from './driver.service';
import { DriverResolver } from './driver.resolver';
import { UploadUrlService } from './upload-url.service';

@Module({
  imports: [TypeOrmModule.forFeature([DriverEntity, DriverDocumentEntity])],
  providers: [DriverService, DriverResolver, UploadUrlService],
  exports: [DriverService],
})
export class DriverModule {}
