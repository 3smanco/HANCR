import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverStarsEntity } from '@hancr/database';
import { StarsService } from './stars.service';
import { StarsResolver } from './stars.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([DriverStarsEntity])],
  providers: [StarsService, StarsResolver],
  exports: [StarsService],
})
export class StarsModule {}
