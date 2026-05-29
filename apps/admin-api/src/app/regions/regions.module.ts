import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionEntity } from '@hancr/database';
import { RegionsService } from './regions.service';
import { RegionsResolver } from './regions.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([RegionEntity])],
  providers: [RegionsService, RegionsResolver],
  exports: [RegionsService],
})
export class RegionsModule {}
