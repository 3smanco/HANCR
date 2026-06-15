import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceEntity, RegionEntity } from '@hancr/database';
import { ServiceResolver } from './service.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceEntity, RegionEntity])],
  providers: [ServiceResolver],
})
export class ServiceModule {}
