import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverEntity } from '@hancr/database';
import { DriverService } from './driver.service';
import { DriverResolver } from './driver.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([DriverEntity])],
  providers: [DriverService, DriverResolver],
  exports: [DriverService],
})
export class DriverModule {}
