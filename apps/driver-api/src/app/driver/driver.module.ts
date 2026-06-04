import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverDocumentEntity, DriverEntity } from '@hancr/database';
import { DriverService } from './driver.service';
import { DriverResolver } from './driver.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([DriverEntity, DriverDocumentEntity])],
  providers: [DriverService, DriverResolver],
  exports: [DriverService],
})
export class DriverModule {}
